/*
    IARTI - PROLOG SCHEDULING SERVER (v4 - Multi-Crane)
    Includes US 3.4.2 (Optimal), US 3.4.4 (Heuristic), and US 3.4.5 (Multi-Crane)
*/

% --- 1. HTTP Server Libraries ---
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_parameters)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_cors)).

% --- 2. SHARED Scheduling Logic ---
:- dynamic vessel/5.
:- dynamic shortest_delay/2.
max_cranes(2). % Constraint for US 3.4.5 (Multi-Crane)

% sequence_temporization/2: Calculates the timeline
sequence_temporization(LV, SeqTriplets) :-
    sequence_temporization1(0, LV, SeqTriplets).

sequence_temporization1(EndPrevSeq, [V|LV], [(V, TInUnload, TEndLoad)|SeqTriplets]) :-
    vessel(V, TIn, _, TUnload, TLoad),
    (   (TIn > EndPrevSeq, !, TInUnload is TIn)
    ;   TInUnload is EndPrevSeq + 1
    ),
    TEndLoad is TInUnload + TUnload + TLoad - 1,
    sequence_temporization1(TEndLoad, LV, SeqTriplets).
sequence_temporization1(_, [], []).

% sum_delays/2: Calculates total delay
sum_delays([], 0).
sum_delays([(V, _, TEndLoad)|LV], S) :-
    vessel(V, _, TDep, _, _),
    TPossibleDep is TEndLoad + 1,
    (   (TPossibleDep > TDep, !, SV is TPossibleDep - TDep)
    ;   SV is 0
    ),
    sum_delays(LV, SLV),
    S is SV + SLV.

% ============================================================
% ALGORITHM 1: OPTIMAL (US 3.4.2) - Slow but Perfect
% ============================================================
obtain_seq_shortest_delay(SeqBetterTriplets, SShortestDelay) :-
    findall(V, vessel(V, _, _, _, _), LV),
    (   obtain_seq_shortest_delay1(LV)
    ;   true
    ),
    retract(shortest_delay(SeqBetterTriplets, SShortestDelay)).

obtain_seq_shortest_delay1(LV) :-
    asserta(shortest_delay(_, 100000)), 
    permutation(LV, SeqV),          % <--- THE BOTTLENECK (Try every combination)
    sequence_temporization(SeqV, SeqTriplets),
    sum_delays(SeqTriplets, S),
    compare_shortest_delay(SeqTriplets, S),
    fail. 

compare_shortest_delay(SeqTriplets, S) :-
    shortest_delay(_, SLower),
    (   (S < SLower, !, retract(shortest_delay(_, _)),
         asserta(shortest_delay(SeqTriplets, S)))
    ;   true
    ).

% ============================================================
% ALGORITHM 2: HEURISTIC (US 3.4.4) - Fast but Approximation
% ============================================================

% 1. Comparator: Decides who comes first.
% Rule: Earlier Arrival First. If tie, Earlier Deadline First.
compare_vessels(Order, V1, V2) :-
    vessel(V1, Arr1, Dep1, _, _),
    vessel(V2, Arr2, Dep2, _, _),
    (   Arr1 < Arr2 -> Order = <
    ;   Arr1 > Arr2 -> Order = >
    ;   (Dep1 < Dep2 -> Order = < ; Order = >) % Tie-breaker
    ).

% 2. Main Heuristic Predicate
obtain_heuristic_schedule(SeqTriplets, TotalDelay) :-
    findall(V, vessel(V, _, _, _, _), LV),
    
    % HERE IS THE MAGIC: Sort instead of Permutation
    predsort(compare_vessels, LV, SortedVessels),
    
    sequence_temporization(SortedVessels, SeqTriplets),
    sum_delays(SeqTriplets, TotalDelay).

% ============================================================
% ALGORITHM 3: MULTI-CRANE (US 3.4.5) - Dynamic Crane Allocation
% ============================================================

% calculate_duration/4: Calculates operation duration with multiple cranes
% Duration is divided by number of cranes and rounded up
calculate_duration(Unload, Load, Cranes, Duration) :-
    Duration is ceiling((Unload + Load) / Cranes).

% find_min_cranes/5: Finds minimum cranes needed to meet deadline
% Tries from 1 crane up to max_cranes to find optimal allocation
find_min_cranes(StartTime, Unload, Load, Deadline, SelectedCranes) :-
    max_cranes(Max),
    between(1, Max, C),
    calculate_duration(Unload, Load, C, Dur),
    EndsAt is StartTime + Dur - 1,
    (EndsAt =< Deadline -> SelectedCranes = C ; C = Max), !.

% schedule_multicrane/4: Generates schedule with variable crane allocation
schedule_multicrane(_, [], [], 0).
schedule_multicrane(EndPrev, [V|RestV], [Trip|RestTrips], TotalDelay) :-
    vessel(V, Arr, Deadline, Unload, Load),
    (Arr > EndPrev -> Start is Arr ; Start is EndPrev + 1),
    
    find_min_cranes(Start, Unload, Load, Deadline, Cranes),
    calculate_duration(Unload, Load, Cranes, Dur),
    End is Start + Dur - 1,
    
    % Calculate Delay for this vessel
    ActualDeparture is End + 1,
    (ActualDeparture > Deadline -> Delay is ActualDeparture - Deadline ; Delay is 0),
    
    % Create JSON Object with crane information
    atom_string(V, VStr),
    Trip = json([vessel=VStr, start=Start, end=End, cranes=Cranes, delay=Delay]),
    
    schedule_multicrane(End, RestV, RestTrips, RestDelay),
    TotalDelay is Delay + RestDelay.

% obtain_multicrane_schedule/2: Main predicate for multi-crane scheduling
obtain_multicrane_schedule(ScheduleJSON, TotalDelay) :-
    findall(V, vessel(V, _, _, _, _), LV),
    predsort(compare_vessels, LV, SortedVessels), % Use Heuristic Sort order
    schedule_multicrane(0, SortedVessels, ScheduleJSON, TotalDelay).


% --- 3. HTTP Server Implementation ---

:- set_setting(http:cors, [*]).

% I created two endpoints so you can call them separately from C#
:- http_handler('/api/schedule/optimal', handle_schedule_optimal, [method(post)]).
:- http_handler('/api/schedule/heuristic', handle_schedule_heuristic, [method(post)]).
:- http_handler('/api/schedule/multicrane', handle_schedule_multicrane, [method(post)]).

server(Port) :-
    http_server(http_dispatch, [port(Port)]).

% --- HANDLER 1: OPTIMAL ---
handle_schedule_optimal(Request) :-
    cors_enable(Request, [methods([post])]),
    http_read_json(Request, JSON_Data, [json_object(list)]),
    process_vessels(JSON_Data),
    
    % Measure Time (Server Side)
    get_time(Ti),
    obtain_seq_shortest_delay(SeqBetterTriplets, SShortestDelay),
    get_time(Tf),
    Tempo is Tf - Ti,
    
    retractall(vessel(_, _, _, _, _)),
    format_schedule_json(SeqBetterTriplets, ScheduleJSON),

    % Print to Server Terminal
    write('Request handled: OPTIMAL. Time: '), write(Tempo), nl,

    reply_json(json{
        schedule: ScheduleJSON, 
        delay: SShortestDelay,
        execution_time: Tempo,
        type: "optimal"
    }).

% --- HANDLER 2: HEURISTIC ---
handle_schedule_heuristic(Request) :-
    cors_enable(Request, [methods([post])]),
    http_read_json(Request, JSON_Data, [json_object(list)]),
    process_vessels(JSON_Data),
    
    % Measure Time (Server Side)
    get_time(Ti),
    obtain_heuristic_schedule(SeqBetterTriplets, SShortestDelay),
    get_time(Tf),
    Tempo is Tf - Ti,
    
    retractall(vessel(_, _, _, _, _)),
    format_schedule_json(SeqBetterTriplets, ScheduleJSON),

    % Print to Server Terminal
    write('Request handled: HEURISTIC. Time: '), write(Tempo), nl,

    reply_json(json{
        schedule: ScheduleJSON, 
        delay: SShortestDelay,
        execution_time: Tempo,
        type: "heuristic"
    }).

% --- HANDLER 3: MULTI-CRANE ---
handle_schedule_multicrane(Request) :-
    cors_enable(Request, [methods([post])]),
    http_read_json(Request, JSON_Data, [json_object(list)]),
    process_vessels(JSON_Data),
    
    % Measure Time (Server Side)
    get_time(Ti),
    obtain_multicrane_schedule(SeqBetterTriplets, SShortestDelay),
    get_time(Tf),
    Tempo is Tf - Ti,
    
    retractall(vessel(_, _, _, _, _)),
    format_schedule_json(SeqBetterTriplets, ScheduleJSON),

    % Print to Server Terminal
    write('Request handled: MULTI-CRANE. Time: '), write(Tempo), nl,

    reply_json(json{
        schedule: ScheduleJSON, 
        delay: SShortestDelay,
        execution_time: Tempo,
        type: "multicrane"
    }).

% --- HELPERS ---
process_vessels([]). 
process_vessels([VesselJSON | Rest]) :-
    VesselJSON = json(DataList), 
    member(id=VesselRef, DataList),
    member(estimatedArrival=ArrivalStr, DataList),
    member(estimatedDeparture=DepartureStr, DataList),
    member(unloadingTime=UnloadingTime, DataList),
    member(loadingTime=LoadingTime, DataList),     
    atom_string(VesselAtom, VesselRef),
    atom_number(ArrivalStr, ArrivalTime),
    atom_number(DepartureStr, DepartureTime),
    asserta(vessel(VesselAtom, ArrivalTime, DepartureTime, UnloadingTime, LoadingTime)),
    process_vessels(Rest).

format_schedule_json([], []).
format_schedule_json([(Vessel, Start, End) | RestTriplets], [ [VesselStr, Start, End] | RestJSON ]) :-
    atom_string(Vessel, VesselStr),
    format_schedule_json(RestTriplets, RestJSON).

:- server(5001).


% ============================================================
% 5. PERFORMANCE TESTS (TERMINAL USE)
% ============================================================

% Teste 1: OPTIMAL (Seu código original)
teste_performance(SequenciaOtima, AtrasoMinimo) :-
    get_time(Ti),
    obtain_seq_shortest_delay(SequenciaOtima, AtrasoMinimo),
    get_time(Tf),
    Tempo is Tf - Ti,
    
    write('--- RESULTADO OPTIMAL (US 3.4.2) ---'), nl,
    write('Melhor Sequencia: '), write(SequenciaOtima), nl,
    write('Menor Atraso Total: '), write(AtrasoMinimo), nl,
    write('Tempo de execucao (s): '), write(Tempo), nl,
    write('------------------------------------------'), nl.

% Teste 2: HEURISTIC (US 3.4.4 - Novo)
teste_performance_heuristic(SequenciaHeuristica, Atraso) :-
    get_time(Ti),
    % Chamamos o novo predicado aqui
    obtain_heuristic_schedule(SequenciaHeuristica, Atraso),
    get_time(Tf),
    Tempo is Tf - Ti,
    
    write('--- RESULTADO HEURISTICA (US 3.4.4) ---'), nl,
    write('Sequencia Gerada: '), write(SequenciaHeuristica), nl,
    write('Atraso Total: '), write(Atraso), nl,
    write('Tempo de execucao (s): '), write(Tempo), nl,
    write('------------------------------------------'), nl.

% Teste 3: MULTI-CRANE (US 3.4.5 - Novo)
teste_performance_multicrane(SequenciaMulticrane, AtrasoTotal) :-
    get_time(Ti),
    obtain_multicrane_schedule(SequenciaMulticrane, AtrasoTotal),
    get_time(Tf),
    Tempo is Tf - Ti,
    
    write('--- RESULTADO MULTI-CRANE (US 3.4.5) ---'), nl,
    write('Sequencia Gerada: '), write(SequenciaMulticrane), nl,
    write('Atraso Total: '), write(AtrasoTotal), nl,
    write('Tempo de execucao (s): '), write(Tempo), nl,
    write('------------------------------------------'), nl.
