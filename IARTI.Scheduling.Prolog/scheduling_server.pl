/*
    IARTI - PROLOG SCHEDULING SERVER (v2)
    
    FIX: Corrected `process_vessels/1` to handle the JSON
    format (list of pairs) sent by C#.
*/

% --- 1. HTTP Server Libraries ---
:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_parameters)).
:- use_module(library(http/http_json)).
:- use_module(library(http/http_cors)).

% --- 2. Scheduling Logic (from logicEx.txt / TP Support) ---
:- dynamic vessel/5.
:- dynamic shortest_delay/2.

% sequence_temporization/2: Calculates the timeline for a given sequence
sequence_temporization(LV, SeqTriplets) :-
    sequence_temporization1(0, LV, SeqTriplets).

sequence_temporization1(EndPrevSeq, [V|LV], [(V, TInUnload, TEndLoad)|SeqTriplets]) :-
    vessel(V, TIn, _, TUnload, TLoad),
    (   (TIn > EndPrevSeq, !, TInUnload is TIn)
    ;   TInUnload is EndPrevSeq + 1
    ),
    % TEndLoad is TInUnload + Duration - 1. (e.g. 10 + 8 - 1 = 17)
    % This represents the interval [10, 17], which has a duration of 8.
    TEndLoad is TInUnload + TUnload + TLoad - 1,
    sequence_temporization1(TEndLoad, LV, SeqTriplets).
sequence_temporization1(_, [], []).

% sum_delays/2: Calculates the total delay for a scheduled sequence
sum_delays([], 0).
sum_delays([(V, _, TEndLoad)|LV], S) :-
    vessel(V, _, TDep, _, _),
    TPossibleDep is TEndLoad + 1, % When the vessel *actually* departs
    (   (TPossibleDep > TDep, !, SV is TPossibleDep - TDep)
    ;   SV is 0
    ),
    sum_delays(LV, SLV),
    S is SV + SLV.

% obtain_seq_shortest_delay/2: Finds the best permutation
obtain_seq_shortest_delay(SeqBetterTriplets, SShortestDelay) :-
    findall(V, vessel(V, _, _, _, _), LV),
    (   obtain_seq_shortest_delay1(LV)
    ;   true
    ),
    retract(shortest_delay(SeqBetterTriplets, SShortestDelay)).

obtain_seq_shortest_delay1(LV) :-
    asserta(shortest_delay(_, 100000)), 
    permutation(LV, SeqV),
    sequence_temporization(SeqV, SeqTriplets),
    sum_delays(SeqTriplets, S),
    compare_shortest_delay(SeqTriplets, S),
    fail. % Force backtracking

compare_shortest_delay(SeqTriplets, S) :-
    shortest_delay(_, SLower),
    (   (S < SLower, !, retract(shortest_delay(_, _)),
         asserta(shortest_delay(SeqTriplets, S)))
    ;   true
    ).

% --- 3. HTTP Server Implementation ---

:- set_setting(http:cors, [*]).

:- http_handler('/api/schedule', handle_schedule_request, [method(post)]).

server(Port) :-
    http_server(http_dispatch, [port(Port)]).

handle_schedule_request(Request) :-
    cors_enable(Request, [methods([post])]),
    
    % Reads the JSON array `[ {...}, {...} ]` into a Prolog list of json terms
    % `JSON_Data` will be `[ json([id=..., ...]), json([id=..., ...]) ]`
    http_read_json(Request, JSON_Data, [json_object(list)]),
    
    process_vessels(JSON_Data),
    
    obtain_seq_shortest_delay(SeqBetterTriplets, SShortestDelay),
    
    retractall(vessel(_, _, _, _, _)),
    
    % Convert the schedule triplets [('id', 10, 17)] into JSON
    % We need to format this ourselves for the C# code to understand it
    format_schedule_json(SeqBetterTriplets, ScheduleJSON),

    % Send the JSON object back to the C# API
    reply_json(json{
        schedule: ScheduleJSON, 
        delay: SShortestDelay
    }).

% --- THIS IS THE CORRECTED PREDICATE ---
process_vessels([]). % Base case: empty list
process_vessels([VesselJSON | Rest]) :-
    % VesselJSON is a term like: json([id='...', estimatedArrival='10', ...])
    
    % --- THIS IS THE FIX ---
    % We must destructure the term to get the list inside
    VesselJSON = json(DataList), 
    
    % Now we can use member/2 on the DataList
    member(id=VesselRef, DataList),
    member(estimatedArrival=ArrivalStr, DataList),
    member(estimatedDeparture=DepartureStr, DataList),
    member(unloadingTime=UnloadingTime, DataList),
    member(loadingTime=LoadingTime, DataList),     
    
    % Convert string values to the atoms/numbers Prolog needs
    atom_string(VesselAtom, VesselRef),
    atom_number(ArrivalStr, ArrivalTime),
    atom_number(DepartureStr, DepartureTime),
    
    % Create the fact for the algorithm to use
    asserta(vessel(VesselAtom, ArrivalTime, DepartureTime, UnloadingTime, LoadingTime)),
    
    process_vessels(Rest).

% --- NEW HELPER ---
% Converts the Prolog triplet list [ (Atom, Start, End), ... ]
% into a JSON list [ ["Atom", Start, End], ... ]
% This is what the C# `PrologScheduleResponse` class expects.
format_schedule_json([], []).
format_schedule_json([(Vessel, Start, End) | RestTriplets], [ [VesselStr, Start, End] | RestJSON ]) :-
    atom_string(Vessel, VesselStr), % Convert the vessel atom back to a string for JSON
    format_schedule_json(RestTriplets, RestJSON).


% --- 4. Server Auto-Start ---
:- server(5001).