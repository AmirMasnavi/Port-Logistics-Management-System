% -----------------------------------------------------------
% US 4.3.3 - DOCK REBALANCING (LOGIC SEARCH)
% -----------------------------------------------------------
% This algorithm rebalances approved Vessel Visit Notifications 
% to minimize expected delays based on dock and crane constraints.
% -----------------------------------------------------------

% ---------------------------
% Constraints (Criteria i, ii, iii)
% ---------------------------

% (i) Vessel characteristics & (ii) Dock capacity
% A vessel can only be assigned to a dock if it fits (Length)
can_dock(V, D) :-
    vessel_info(V, VLen, _), 
    dock_info(D, DLen, _),
    VLen =< DLen.

% ---------------------------
% Evaluation (Minimize Σ Tj)
% ---------------------------

% Calculate total delay for a mapping: [(V1, D1), (V2, D2)...]
calculate_total_delay(Mapping, TotalDelay) :-
    calculate_map_aux(Mapping, 0, TotalDelay).

calculate_map_aux([], _, 0).
calculate_map_aux([(V, D)|Rest], CurrentTime, TotalDelay) :-
    vessel(V, Arrival, DesiredDep, Unload, Load),
    dock_info(D, _, DCranes),
    
    % (iii) Processing time depends on the number of cranes at the assigned dock
    % Handle edge case: if DCranes is 0, use 1 as default to avoid division by zero
    (DCranes > 0 -> EffectiveCranes = DCranes ; EffectiveCranes = 1),
    ProcTime is ceiling((Unload + Load) / EffectiveCranes),
    
    (Arrival > CurrentTime -> Start = Arrival ; Start is CurrentTime + 1),
    End is Start + ProcTime - 1,
    ActualDep is End + 1,
    
    (ActualDep > DesiredDep -> Delay is ActualDep - DesiredDep ; Delay is 0),
    calculate_map_aux(Rest, End, RemainingDelay),
    TotalDelay is Delay + RemainingDelay.

% ---------------------------
% Rebalancing Core Logic
% ---------------------------

% Entry Point: Finds the optimal reassignment
obtain_rebalancing_schedule(BestMapping, BestDelay) :-
    findall(V, vessel(V, _, _, _, _), VesselList),
    findall(D, dock_info(D, _, _), DockList),
    
    % Generate all possible valid mappings
    findall(Mapping, generate_all_valid_mappings(VesselList, DockList, Mapping), AllSolutions),
    
    % Check if any solutions were found
    (   AllSolutions \= [] ->
        % Pick the one with the minimum delay
        find_best_solution(AllSolutions, BestMapping, BestDelay)
    ;   % No valid solutions found - return empty mapping with delay 0
        BestMapping = [],
        BestDelay = 0
    ).

% Generates a valid mapping by trying every dock for every vessel
generate_all_valid_mappings([], _, []).
generate_all_valid_mappings([V|Vs], DockList, [(V, D)|Rest]) :-
    member(D, DockList),
    can_dock(V, D),
    generate_all_valid_mappings(Vs, DockList, Rest).

% Finds the mapping with the lowest delay in a list of solutions
find_best_solution([H|T], BestMapping, BestDelay) :-
    calculate_total_delay(H, HDelay),
    find_best_aux(T, H, HDelay, BestMapping, BestDelay).

find_best_aux([], CurrentBest, CurrentMin, CurrentBest, CurrentMin).
find_best_aux([Mapping|Rest], _BestSoFar, MinSoFar, FinalBest, FinalMin) :-
    calculate_total_delay(Mapping, Delay),
    Delay < MinSoFar, !,
    find_best_aux(Rest, Mapping, Delay, FinalBest, FinalMin).
find_best_aux([_|Rest], BestSoFar, MinSoFar, FinalBest, FinalMin) :-
    find_best_aux(Rest, BestSoFar, MinSoFar, FinalBest, FinalMin).

% ---------------------------
% End of US 4.3.3 Logic
% ---------------------------