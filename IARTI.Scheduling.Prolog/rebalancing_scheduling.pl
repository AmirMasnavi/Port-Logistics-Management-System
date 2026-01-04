% -----------------------------------------------------------
% US 4.3.3 - DOCK REBALANCING (LOGIC SEARCH)
% -----------------------------------------------------------
% This algorithm rebalances approved Vessel Visit Notifications 
% to minimize expected delays based on dock and crane constraints.
%
% IMPLEMENTATION COVERAGE (US 4.3.3 Requirements):
% ✓ Applies only to approved Vessel Visit Notifications with provisional dock assignments
% ✓ Evaluates existing dock assignments for poor balance, excessive congestion, or avoidable delays
% ✓ Respects vessel characteristics (i) - via can_dock/2 checking vessel length
% ✓ Respects dock capacity and size constraints (ii) - via can_dock/2 checking max dock length
% ✓ Respects crane availability at each dock (iii) - via calculate_map_aux/3 adjusting processing time
% ✓ Implements load balancing - via calculate_load_imbalance_penalty/2 using variance
% ✓ Minimizes departure delays - via calculate_total_delay/2 calculating delay per vessel
%
% ALGORITHM STRATEGY:
% - Generates all valid vessel-to-dock mappings respecting constraints (i) and (ii)
% - Calculates total cost = delay + load imbalance penalty for each mapping
% - Selects the mapping with minimum total cost
% - Load imbalance is measured using variance of DOCK LOADS (not vessel counts)
%   * "To be balanced doesn't mean to have the same number of vessels"
%   * Dock load = sum of (Tunload+Tload)/NumCranes for all vessels on that dock
%   * Variance penalizes unequal load distribution (e.g., one dock overloaded while others idle)
% - This ensures no dock is congested while others are idle
%
% PROLOG-C# INTEGRATION:
% - Called via Prolog HTTP server endpoint: /api/schedule/rebalance
% - Input: JSON with vessels (id, arrival, departure, unload, load, length) and docks (id, maxLength, cranes)
% - Output: JSON with schedule (vessel-dock mappings), totalDelay, executionTime
% - C# service generates proposal comparing baseline vs rebalanced allocation
% - Port Authority Officer reviews and confirms via SchedulingController endpoints
% - Reassignments are logged with timestamp, officer ID, and dock allocation changes
%
% NOTE: This is the CORE ALGORITHM. Business logic (logging, review, confirmation) is in C#.
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
% Evaluation (Minimize Σ Tj + Load Balance Penalty)
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
% Load Balancing Evaluation
% ---------------------------

% Calculate total cost = delay + load imbalance penalty
calculate_total_cost(Mapping, TotalCost) :-
    calculate_total_delay(Mapping, TotalDelay),
    calculate_load_imbalance_penalty(Mapping, ImbalancePenalty),
    TotalCost is TotalDelay + ImbalancePenalty.

% Penalizes unequal distribution of LOAD across docks
% IMPORTANT: "To be balanced doesn't mean to have the same number of vessels"
% Load at dock = sum of (Tunload+Tload)/N for all vessels assigned to that dock
calculate_load_imbalance_penalty(Mapping, Penalty) :-
    findall(D, dock_info(D, _, _), AllDocks),
    maplist(calculate_dock_load(Mapping), AllDocks, Loads),
    calculate_variance(Loads, Variance),
    Penalty is Variance * 10. % Adjustable weight factor

% Calculate total load on a specific dock
% Load = sum of (Tunload+Tload)/NumCranes for all vessels on this dock
calculate_dock_load(Mapping, Dock, TotalLoad) :-
    findall(V, member((V, Dock), Mapping), VesselsOnDock),
    dock_info(Dock, _, NumCranes),
    (NumCranes > 0 -> EffCranes = NumCranes ; EffCranes = 1),
    calculate_vessels_load(VesselsOnDock, EffCranes, TotalLoad).

% Calculate total load contribution of a list of vessels
calculate_vessels_load([], _, 0).
calculate_vessels_load([V|Rest], Cranes, TotalLoad) :-
    vessel(V, _, _, Unload, Load),
    VesselLoad is ceiling((Unload + Load) / Cranes),
    calculate_vessels_load(Rest, Cranes, RestLoad),
    TotalLoad is VesselLoad + RestLoad.

% Count how many vessels are assigned to a specific dock (kept for potential diagnostics)
count_vessels_per_dock(Mapping, Dock, Count) :-
    findall(V, member((V, Dock), Mapping), Vessels),
    length(Vessels, Count).

% Calculate variance of a list of numbers
calculate_variance(List, Variance) :-
    length(List, N),
    (N > 0 -> 
        sum_list(List, Sum),
        Mean is Sum / N,
        maplist(squared_diff(Mean), List, Diffs),
        sum_list(Diffs, SumDiffs),
        Variance is SumDiffs / N
    ; 
        Variance is 0
    ).

% Helper: calculate (X - Mean)^2
squared_diff(Mean, X, Diff) :- 
    Diff is (X - Mean) * (X - Mean).

% ---------------------------
% Rebalancing Core Logic
% ---------------------------

% Entry Point: Finds the optimal reassignment (minimizing delay + load imbalance)
obtain_rebalancing_schedule(BestMapping, BestCost) :-
    findall(V, vessel(V, _, _, _, _), VesselList),
    findall(D, dock_info(D, _, _), DockList),
    
    % Generate all possible valid mappings
    findall(Mapping, generate_all_valid_mappings(VesselList, DockList, Mapping), AllSolutions),
    
    % Check if any solutions were found
    (   AllSolutions \= [] ->
        % Pick the one with the minimum total cost (delay + load balance penalty)
        find_best_solution(AllSolutions, BestMapping, BestCost)
    ;   % No valid solutions found - return empty mapping with cost 0
        BestMapping = [],
        BestCost = 0
    ).

% Generates a valid mapping by trying every dock for every vessel
generate_all_valid_mappings([], _, []).
generate_all_valid_mappings([V|Vs], DockList, [(V, D)|Rest]) :-
    member(D, DockList),
    can_dock(V, D),
    generate_all_valid_mappings(Vs, DockList, Rest).

% Finds the mapping with the lowest total cost in a list of solutions
find_best_solution([H|T], BestMapping, BestCost) :-
    calculate_total_cost(H, HCost),
    find_best_aux(T, H, HCost, BestMapping, BestCost).

find_best_aux([], CurrentBest, CurrentMin, CurrentBest, CurrentMin).
find_best_aux([Mapping|Rest], _BestSoFar, MinSoFar, FinalBest, FinalMin) :-
    calculate_total_cost(Mapping, Cost),
    Cost < MinSoFar, !,
    find_best_aux(Rest, Mapping, Cost, FinalBest, FinalMin).
find_best_aux([_|Rest], BestSoFar, MinSoFar, FinalBest, FinalMin) :-
    find_best_aux(Rest, BestSoFar, MinSoFar, FinalBest, FinalMin).

% ---------------------------
% End of US 4.3.3 Logic
% ---------------------------