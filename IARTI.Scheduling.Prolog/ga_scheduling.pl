% ---------------------------
% GA adapted to Vessels scheduling
% - uses vessels instead of tasks
% - supports multiple cranes
% - elitism + random permutation before crossover
% - evaluation = sum of delays (Σ Tj)
% ---------------------------

:- dynamic generations/1.
:- dynamic population/1.
:- dynamic prob_crossover/1.
:- dynamic prob_mutation/1.
:- dynamic elite_pct/1.
:- dynamic target_cost/1.
:- dynamic stabilize_gens/1.

% Default GA parameters (can be set by initialize/0)
generations(50).
population(20).
prob_crossover(0.6).
prob_mutation(0.2).
elite_pct(20).          % percent of population preserved as elite
target_cost(0).        % if >0, GA stops when best cost <= target_cost
stabilize_gens(10).    % stop if population stable for this many gens

% ---------------------------
% Example vessels facts (replace / adapt to your data)
% vessel(Id, ArrivalTime, DesiredDeparture, UnloadUnits, LoadUnits).
% (Some parts of your system might store cargoweight; adapt get_vessel_processing_values/4)
% ---------------------------
% vessel(v1, 1, 10, 200, 200).
% vessel(v2, 2, 12, 100, 120).
% vessel(v3, 0, 8,  50,  50).
% ... (use your real facts)

% ---------------------------
% Helper predicates to obtain vessel durations and number of cranes
% Adapt these to query your actual vessel_visit/dock tables if names differ.
% ---------------------------

% number_of_cranes_for_vessel(+Vessel, -Cranes)
% Try to fetch assigned dock and consult dock facts.
% If no info found, fall back to 1 crane or a global max_cranes/1 if declared.
number_of_cranes_for_vessel(V, Cranes) :-
    % Try to catch any errors and use default if needed
    catch(
        (
            % If there's a vessel_visit with assigned dock and that dock has numberOfSTSCranes
            (   vessel_visit(V, AssignedDock, _CargoWeight, _Other),
                dock(AssignedDock, _Name, _OtherAttr, NumberOfSTSCranes)
            ->  Cranes = NumberOfSTSCranes
            ;   % Otherwise try vessel docking info: vessel_dock/2 or similar (adapt as needed)
                (   vessel_dock(V, AssignedDock2),
                    dock(AssignedDock2, _Name2, _Other2, NumberOfSTSCranes2)
                ->  Cranes = NumberOfSTSCranes2
                ;   % Fallback: global predicate max_cranes/1 if provided, else 1
                    (   current_predicate(max_cranes/1), max_cranes(MX) -> Cranes = MX ; Cranes = 1)
                )
            )
        ),
        _Error,
        % On any error, use default (check if max_cranes exists)
        (   current_predicate(max_cranes/1), max_cranes(MX) -> Cranes = MX ; Cranes = 1)
    ), !.

% Fallback if catch fails
number_of_cranes_for_vessel(_, 1).

% get_vessel_processing_values(+Vessel, -Unload, -Load, -DesiredDep)
% Try various schemas: vessel/5 or vessel_visit with cargoweight.
get_vessel_processing_values(V, Unload, Load, DesiredDep) :-
    (   % prefer the canonical vessel/5
        vessel(V, _Arr, DesiredDep, Unload, Load)
    ->  true
    ;   % else try vessel_visit that stores cargoweight attribute (user said cargoweight)
        (   vessel_visit(V, _Dock, CargoWeight, DesiredDep)
        ->  % the user said loading time = unloading time = (cargoweight/2)/1000
            Time is (CargoWeight/2) / 1000,
            % For GA we want integer processing units (minutes/slots), round up to integer
            P is ceiling(Time),
            Unload = P, Load = P
        ;   % if nothing available, fail
            fail
        )
    ).

% compute_processing_time(+Vessel, +Cranes, -ProcTime)
% For each vessel, processing time = ceiling((Unload + Load) / Cranes)
compute_processing_time(V, Cranes, ProcTime) :-
    get_vessel_processing_values(V, Unload, Load, _DesiredDep),
    Sum is Unload + Load,
    ProcTime is ceiling(Sum / Cranes).

% ---------------------------
% GA: Initialization (interactive or programmatic)
% ---------------------------

initialize :-
    write('Number of new generations: '), read(NG),
    (retract(generations(_)); true), asserta(generations(NG)),
    write('Population size: '), read(PS),
    (retract(population(_)); true), asserta(population(PS)),
    write('Probability of crossover (%): '), read(P1), PC is P1/100,
    (retract(prob_crossover(_)); true), asserta(prob_crossover(PC)),
    write('Probability of mutation (%): '), read(P2), PM is P2/100,
    (retract(prob_mutation(_)); true), asserta(prob_mutation(PM)),
    write('Elite percent (e.g. 20): '), read(E), (retract(elite_pct(_)); true), asserta(elite_pct(E)),
    write('Target cost to stop (0=disabled): '), read(TC), (retract(target_cost(_)); true), asserta(target_cost(TC)),
    write('Stabilize gens to stop (e.g. 10): '), read(SG), (retract(stabilize_gens(_)); true), asserta(stabilize_gens(SG)).

% ---------------------------
% Population generation: individuals are permutations of vessels
% ---------------------------

generate :-
    initialize,
    generate_population(Pop),
    write('Initial population: '), nl, write(Pop), nl,
    evaluate_population(Pop, PopVal),
    order_population(PopVal, PopOrd),
    generations(NG),
    % start GA, with tracking of last best to detect stabilization
    generate_generation(0, NG, PopOrd, none, 0).

generate_population(Pop) :-
    population(PopSize),
    findall(V, vessel(V, _, _, _, _), VesselList),
    length(VesselList, NumV),
    generate_population(PopSize, VesselList, NumV, Pop).

generate_population(0, _, _, []) :- !.
generate_population(PopSize, VesselList, NumV, [Ind|Rest]) :-
    PopSize1 is PopSize - 1,
    generate_population(PopSize1, VesselList, NumV, Rest),
    generate_individual(VesselList, NumV, Ind),
    not(member(Ind, Rest)).   % ensure uniqueness

generate_individual([G], 1, [G]) :- !.
generate_individual(VList, N, [G|Rest]) :-
    NTemp is N + 1,
    random(1, NTemp, Pos),
    remove_nth(Pos, VList, G, NewList),
    N1 is N - 1,
    generate_individual(NewList, N1, Rest).

remove_nth(1, [X|Xs], X, Xs) :- !.
remove_nth(N, [Y|Ys], X, [Y|Rest]) :-
    N1 is N - 1, remove_nth(N1, Ys, X, Rest).

% ---------------------------
% Population evaluation: sum of delays Σ Tj (no weights)
% For a given individual (sequence of vessels) we must compute start/end times
% and delays considering number of cranes for each vessel (can be variable).
% ---------------------------

evaluate_population([], []).
evaluate_population([Ind|Rest], [Ind*Val|Rest1]) :-
    evaluate(Ind, Val),
    evaluate_population(Rest, Rest1).

% evaluate(+Sequence, -TotalDelay)
evaluate(Seq, V) :- evaluate(Seq, 0, V).

evaluate([], _Inst, 0).
evaluate([V|Rest], Inst, Vsum) :-
    % determine number of cranes for this vessel
    number_of_cranes_for_vessel(V, Cranes),
    compute_processing_time(V, Cranes, Dur),
    % start time for this vessel: if Arr>Inst then we can start at Arr, else after Inst
    (   vessel(V, Arr, DesiredDep, _Unload, _Load) -> true ; Arr = 0, DesiredDep = 100000 ),
    (Arr > Inst -> Start = Arr ; Start is Inst + 1),
    End is Start + Dur - 1,
    ActualDep is End + 1,
    (ActualDep > DesiredDep -> Delay is ActualDep - DesiredDep ; Delay is 0),
    evaluate(Rest, End, Vrest),
    Vsum is Delay + Vrest.

% If you have other vessel schemas, ensure vessel/5 or vessel_visit data is provided.

% ---------------------------
% Ordering & sorting helpers
% ---------------------------

order_population(PopValue, PopValueOrd) :-
    bsort(PopValue, PopValueOrd).

bsort([X], [X]) :- !.
bsort([X|Xs], Ys) :- bsort(Xs, Zs), bchange([X|Zs], Ys).

bchange([X], [X]) :- !.
bchange([X*VX, Y*VY | L1], [Y*VY | L2]) :-
    VX > VY, !,
    bchange([X*VX | L1], L2).
bchange([X | L1], [X | L2]) :- bchange(L1, L2).

% ---------------------------
% GA main loop with elitism and multiple stop criteria
% generate_generation(CurGen, MaxGen, PopulationSorted, LastBest, StableCount)
% LastBest = last best cost seen (number), StableCount = how many gens unchanged
% ---------------------------

generate_generation(G, G, Pop, _LastBest, _Stable) :-
    write('Final Generation '), write(G), write(':'), nl, write(Pop), nl, !.
generate_generation(N, G, Pop, LastBest, StableCount) :-
    write('Generation '), write(N), write(':'), nl, write(Pop), nl,
    % extract individuals from Pop (Pop is list Ind*Val)
    extract_inds_vals(Pop, Inds, Vals),
    % random permutation of population to avoid fixed pairing
    random_permutation(Inds, PermutedInds),
    % perform crossover on the permuted list -> children
    crossover(PermutedInds, Children),
    % mutation on children
    mutation(Children, MutChildren),
    % evaluate children
    evaluate_population(MutChildren, MutChildrenVal),
    % combine parents and children for selection
    append(Pop, MutChildrenVal, Combined),
    % remove duplicates by individual sequence (keep best eval for duplicates)
    unique_by_individual(Combined, UniqueCombined),
    % order combined by evaluation
    order_population(UniqueCombined, SortedCombined),
    % selection with elitism and probabilistic selection for remainder
    population(PopSize),
    elite_pct(EP),
    compute_elite_count(PopSize, EP, EliteCount),
    % pick top EliteCount as guaranteed survivors
    prefix_len(SortedCombined, EliteCount, EliteList, RestList),
    % remaining slots = PopSize - EliteCount
    Remaining is PopSize - EliteCount,
    (Remaining < 0 -> Remaining1 = 0 ; Remaining1 = Remaining),
    % create probabilistic selection pool from RestList:
    probabilistic_select(RestList, Remaining1, SelectedRest),
    append(EliteList, SelectedRest, NewPop),
    % order new pop
    order_population(NewPop, NewPopOrd),
    % check stop conditions: target_cost, stabilization
    NewPopOrd = [BestInd*BestVal | _],
    (   LastBest = none -> NewStableCount = 1
    ;   (   LastBest = BestVal -> NewStableCount is StableCount + 1 ; NewStableCount = 0)
    ),
    target_cost(TC),
    stabilize_gens(SG),
    (   (TC > 0, BestVal =< TC)
    ->  write('Target cost achieved; stopping.'), nl, write('Best: '), write(BestInd*BestVal), nl
    ;   (   NewStableCount >= SG
        ->  write('Population stabilized for '), write(SG), write(' gens; stopping.'), nl, write('Best: '), write(BestInd*BestVal), nl
        ;   % otherwise continue
            N1 is N + 1,
            generate_generation(N1, G, NewPopOrd, BestVal, NewStableCount)
        )
    ).

% ---------------------------
% Utilities used in generate_generation
% ---------------------------

extract_inds_vals([], [], []).
extract_inds_vals([Ind*Val | Rest], [Ind | RInd], [Val | RVal]) :-
    extract_inds_vals(Rest, RInd, RVal).

% crossover operates on a list of individuals (permuted), pairs them sequentially
% if odd, last stays unchanged; returns list of offspring individuals (sequences only)
crossover([], []).
crossover([I], [I]).   % single individual passes through
crossover([I1, I2 | R], [CI1, CI2 | R2]) :-
    prob_crossover(Pc),
    random(0.0, 1.0, Rv),
    ( Rv =< Pc ->
        % order crossover (as in original): cross(I1,I2,P1,P2,CI1), cross(I2,I1,P1,P2,CI2)
        generate_crossover_points(P1, P2),
        cross(I1, I2, P1, P2, CI1),
        cross(I2, I1, P1, P2, CI2)
    ; CI1 = I1, CI2 = I2
    ),
    crossover(R, R2).

% mutation: similar to original, but expects individuals are lists of vessel ids
mutation([], []).
mutation([Ind | Rest], [NInd | Rest1]) :-
    prob_mutation(Pmut),
    random(0.0, 1.0, Pm),
    (   Pm < Pmut -> mutacao1(Ind, NInd) ; NInd = Ind ),
    mutation(Rest, Rest1).

% generate_crossover_points/2 and order crossover reuse original implementation:
generate_crossover_points(P1, P2) :- generate_crossover_points1(P1, P2).
generate_crossover_points1(P1, P2) :-
    length_of_vessels(N),
    NTemp is N + 1,
    random(1, NTemp, P11),
    random(1, NTemp, P21),
    P11 \== P21, !,
    ( (P11 < P21, !, P1 = P11, P2 = P21) ; P1 = P21, P2 = P11 ).
generate_crossover_points1(P1, P2) :- generate_crossover_points1(P1, P2).

% length_of_vessels(-N) - number of vessels to schedule (assumes static set)
length_of_vessels(N) :- findall(V, vessel(V, _, _, _, _), L), length(L, N).

% cross/5, insert, remove, rotate_right etc reuse the original order crossover implementation:
% (We include simplified/compatible versions below — you can replace with your exact original routines)

sublist(L1, I1, I2, L) :- I1 < I2, !, sublist1(L1, I1, I2, L).
sublist(L1, I1, I2, L) :- sublist1(L1, I2, I1, L).

sublist1([X|R1], 1, 1, [X|H]) :- !, fillh(R1, H).
sublist1([X|R1], 1, N2, [X|R2]) :- !, N3 is N2 - 1, sublist1(R1, 1, N3, R2).
sublist1([_|R1], N1, N2, [h|R2]) :- N3 is N1 - 1, N4 is N2 - 1, sublist1(R1, N3, N4, R2).

fillh([], []).
fillh([_|R1], [h|R2]) :- fillh(R1, R2).

rotate_right(L, K, L1) :- length_of_vessels(N), T is N - K, rr(T, L, L1).
rr(0, L, L) :- !.
rr(N, [X|R], R2) :- N1 is N - 1, append(R, [X], R1), rr(N1, R1, R2).

remove([], _, []) :- !.
remove([X|R1], L, [X|R2]) :- not(member(X, L)), !, remove(R1, L, R2).
remove([_|R1], L, R2) :- remove(R1, L, R2).

insert([], L, _, L) :- !.
insert([X|R], L, N, L2) :-
    length_of_vessels(T),
    (N > T -> N1 is N mod T ; N1 = N),
    insert1(X, N1, L, L1),
    N2 is N + 1,
    insert(R, L1, N2, L2).

insert1(X, 1, L, [X|L]) :- !.
insert1(X, N, [Y|L], [Y|L1]) :- N1 is N - 1, insert1(X, N1, L, L1).

removeh([], []).
removeh([h|R1], R2) :- !, removeh(R1, R2).
removeh([X|R1], [X|R2]) :- removeh(R1, R2).

cross(Ind1, Ind2, P1, P2, NInd11) :-
    sublist(Ind1, P1, P2, Sub1),
    length_of_vessels(NumT),
    R is NumT - P2,
    rotate_right(Ind2, R, Ind21),
    remove(Ind21, Sub1, Sub2),
    P3 is P2 + 1,
    insert(Sub2, Sub1, P3, NInd1),
    removeh(NInd1, NInd11).

% mutacao1 (swap mutation) from original
mutacao1(Ind, NInd) :-
    generate_crossover_points(P1, P2),
    mutacao22(Ind, P1, P2, NInd).

mutacao22([G1|Ind], 1, P2, [G2|NInd]) :- !, P21 is P2 - 1, mutacao23(G1, P21, Ind, G2, NInd).
mutacao22([G|Ind], P1, P2, [G|NInd]) :- P11 is P1 - 1, P21 is P2 - 1, mutacao22(Ind, P11, P21, NInd).

mutacao23(G1, 1, [G2|Ind], G2, [G1|Ind]) :- !.
mutacao23(G1, P, [G|Ind], G2, [G|NInd]) :- P1 is P - 1, mutacao23(G1, P1, Ind, G2, NInd).

% ---------------------------
% Selection helpers: unique combined list, elite selection and probabilistic selection
% ---------------------------

% unique_by_individual(+ListOfInd*Val, -UniqueList) keep best eval for duplicates
unique_by_individual(Combined, Unique) :-
    % fold to map from Ind to best Val, then convert back to list Ind*Val
    unique_map(Combined, [], Pairs),
    pairs_to_list(Pairs, Unique).

unique_map([], Acc, Acc).
unique_map([Ind*Val | Rest], Acc, Result) :-
    (   select(Ind*OldVal, Acc, RestAcc)
    ->  (Val < OldVal -> NewAcc = [Ind*Val | RestAcc] ; NewAcc = [Ind*OldVal | RestAcc])
    ;   NewAcc = [Ind*Val | Acc]
    ),
    unique_map(Rest, NewAcc, Result).

pairs_to_list(Pairs, List) :- List = Pairs.

compute_elite_count(PopSize, EP, Count) :-
    C is ceiling(PopSize * EP / 100),
    (C >= PopSize -> Count = PopSize - 1 ; Count = C).

% prefix_len(List, K, Prefix, Rest)
prefix_len(L, K, P, R) :- prefix_len1(L, K, 0, P, R).
prefix_len1(L, K, K, [], L) :- !.
prefix_len1([X|Xs], K, I, [X|P], R) :- I1 is I + 1, prefix_len1(Xs, K, I1, P, R).

% probabilistic_select(RestList, N, Selected)
% For each remaining individual (=Ind*Val) compute Val*U where U is random(0,1), sort by that product ascending and pick first N
probabilistic_select(RestList, N, Selected) :-
    probabilistic_score(RestList, Scored),
    % sort by product ascending
    sort(2, @=<, Scored, Sorted), % requires [Ind*Val, Product] pairs; we'll transform
    take_n_from_scores(Sorted, N, Selected).

probabilistic_score([], []).
probabilistic_score([Ind*Val | R], [[Ind*Val, Score] | R2]) :-
    random(0.0, 1.0, U), Score is Val * U,
    probabilistic_score(R, R2).

take_n_from_scores(_, 0, []) :- !.
take_n_from_scores([], _, []) :- !.
take_n_from_scores([[Ind*Val, _Score] | Rest], N, [Ind*Val | Out]) :-
    N1 is N - 1, take_n_from_scores(Rest, N1, Out).

% ---------------------------
% End of GA code
% ---------------------------

% ---------------------------
% API Wrapper for HTTP Server Integration
% ---------------------------
% obtain_genetic_schedule/2: Main entry point for HTTP API
% Returns best sequence and delay after running GA
obtain_genetic_schedule(BestSequence, BestDelay) :-
    findall(V, vessel(V, _, _, _, _), VesselList),
    length(VesselList, NumVessels),
    % Handle special cases
    (   NumVessels = 0 ->
        % No vessels: empty schedule
        BestSequence = [],
        BestDelay = 0
    ;   NumVessels = 1 ->
        % Single vessel: no need for GA, just schedule it
        VesselList = [V],
        vessel(V, Arr, Dep, Unload, Load),
        Start = Arr,
        End is Start + Unload + Load - 1,
        ActualDep is End + 1,
        (ActualDep > Dep -> BestDelay is ActualDep - Dep ; BestDelay = 0),
        BestSequence = [(V, Start, End)]
    ;   NumVessels =< 4 ->
        % For small numbers (2-4 vessels): evaluate all permutations (brute force)
        % This is faster and more accurate than GA for small inputs
        findall(Perm, permutation(VesselList, Perm), AllPerms),
        evaluate_all_and_pick_best(AllPerms, BestSequence, BestDelay)
    ;   % 5+ vessels: run GA (more efficient for larger datasets)
        % Limit population size to avoid generating duplicates
        population(RequestedPopSize),
        factorial_limited(NumVessels, MaxPermutations),
        % Ensure population is reasonable (min 5, max min(RequestedPopSize, MaxPermutations))
        (RequestedPopSize > MaxPermutations -> 
            AdjustedPopSize = MaxPermutations 
        ; 
            (RequestedPopSize < 5 -> AdjustedPopSize = 5 ; AdjustedPopSize = RequestedPopSize)
        ),
        % Temporarily set adjusted population size
        retractall(population(_)), asserta(population(AdjustedPopSize)),
        % Generate population with retry logic
        generate_population_with_duplicates_allowed(AdjustedPopSize, VesselList, Pop),
        evaluate_population(Pop, PopVal),
        order_population(PopVal, PopOrd),
        generations(NG),
        % Run GA
        run_ga_silent(0, NG, PopOrd, FinalPop),
        % Extract best individual from final population
        FinalPop = [BestInd*BestVal | _],
        % Convert to triplet format
        compute_schedule_triplets(BestInd, BestSequence),
        BestDelay = BestVal,
        % Restore original population size
        retractall(population(_)), asserta(population(RequestedPopSize))
    ).

% evaluate_all_and_pick_best/3: For small datasets, evaluate all permutations
evaluate_all_and_pick_best([], [], 999999) :- !.
evaluate_all_and_pick_best([Perm|Rest], BestSeq, BestDelay) :-
    evaluate(Perm, Delay),
    compute_schedule_triplets(Perm, Seq),
    evaluate_all_and_pick_best(Rest, RestSeq, RestDelay),
    (Delay =< RestDelay -> BestSeq = Seq, BestDelay = Delay ; BestSeq = RestSeq, BestDelay = RestDelay).

% generate_population_with_duplicates_allowed/3: Generate population allowing duplicates if necessary
generate_population_with_duplicates_allowed(PopSize, VesselList, Pop) :-
    length(VesselList, NumV),
    generate_pop_duplicates_ok(PopSize, VesselList, NumV, Pop).

generate_pop_duplicates_ok(0, _, _, []) :- !.
generate_pop_duplicates_ok(N, VesselList, NumV, [Ind|Rest]) :-
    N1 is N - 1,
    generate_individual(VesselList, NumV, Ind),
    generate_pop_duplicates_ok(N1, VesselList, NumV, Rest).

% factorial_limited/2: Calculate factorial but cap at 1000 to avoid overflow
factorial_limited(N, F) :- 
    factorial_limited(N, 1, F).

factorial_limited(0, Acc, Acc) :- !.
factorial_limited(1, Acc, Acc) :- !.
factorial_limited(N, Acc, F) :- 
    N > 1,
    Acc < 1000, % Cap to avoid huge numbers
    !,
    N1 is N - 1,
    Acc1 is Acc * N,
    factorial_limited(N1, Acc1, F).
factorial_limited(_, Acc, Acc) :- Acc >= 1000, !. % Return cap value

% ---------------------------
% End of API Wrapper
% ---------------------------

% compute_schedule_triplets/2: Convert sequence to triplets
compute_schedule_triplets(VesselSeq, Triplets) :-
    compute_triplets(VesselSeq, 0, Triplets).

compute_triplets([], _, []).
compute_triplets([V|Rest], EndPrev, [(V, Start, End)|RestTriplets]) :-
    vessel(V, Arr, _Dep, Unload, Load),
    % Start is max of arrival time and end of previous vessel
    (Arr > EndPrev -> Start = Arr ; Start is EndPrev + 1),
    % End time
    End is Start + Unload + Load - 1,
    % Process rest of vessels
    compute_triplets(Rest, End, RestTriplets).

% run_ga_silent: GA main loop without console output for API use
run_ga_silent(G, G, Pop, Pop) :- !.
run_ga_silent(N, G, Pop, FinalPop) :-
    % extract individuals from Pop (Pop is list Ind*Val)
    extract_inds_vals(Pop, Inds, _Vals),
    % random permutation of population to avoid fixed pairing
    random_permutation(Inds, PermutedInds),
    % perform crossover on the permuted list -> children
    crossover(PermutedInds, Children),
    % mutation on children
    mutation(Children, MutChildren),
    % evaluate children
    evaluate_population(MutChildren, MutChildrenVal),
    % combine parents and children for selection
    append(Pop, MutChildrenVal, Combined),
    % remove duplicates by individual sequence (keep best eval for duplicates)
    unique_by_individual(Combined, UniqueCombined),
    % order combined by evaluation
    order_population(UniqueCombined, SortedCombined),
    % selection with elitism and probabilistic selection for remainder
    population(PopSize),
    elite_pct(EP),
    compute_elite_count(PopSize, EP, EliteCount),
    % pick top EliteCount as guaranteed survivors
    prefix_len(SortedCombined, EliteCount, EliteList, RestList),
    % remaining slots = PopSize - EliteCount
    Remaining is PopSize - EliteCount,
    (Remaining < 0 -> Remaining1 = 0 ; Remaining1 = Remaining),
    % create probabilistic selection pool from RestList:
    probabilistic_select(RestList, Remaining1, SelectedRest),
    append(EliteList, SelectedRest, NewPop),
    % order new pop
    order_population(NewPop, NewPopOrd),
    % continue to next generation
    N1 is N + 1,
    run_ga_silent(N1, G, NewPopOrd, FinalPop).
