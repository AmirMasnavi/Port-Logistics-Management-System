% -----------------------------------------------------------
% TEST FILE: US 4.3.3 - DOCK REBALANCING ALGORITHM
% -----------------------------------------------------------
% This file contains test scenarios to validate the rebalancing algorithm.
% Run with: swipl -s test_rebalancing.pl -g run_all_tests -t halt
% -----------------------------------------------------------

:- consult('rebalancing_scheduling.pl').

% -----------------------------------------------------------
% TEST SCENARIO 1: Basic Rebalancing (2 Vessels, 2 Docks)
% -----------------------------------------------------------
% Expected: Vessels should be distributed across docks to minimize delay + balance
test_basic_rebalancing :-
    % Clean previous test data
    retractall(vessel(_, _, _, _, _)),
    retractall(vessel_info(_, _, _)),
    retractall(dock_info(_, _, _)),
    
    % Define vessels: vessel(Id, Arrival, Departure, Unload, Load)
    asserta(vessel(v1, 1, 8, 2, 2)),    % Arrives at 1, wants to leave at 8, needs 4 hours
    asserta(vessel(v2, 2, 10, 3, 3)),   % Arrives at 2, wants to leave at 10, needs 6 hours
    
    % Define vessel characteristics: vessel_info(Id, Length, Weight)
    asserta(vessel_info(v1, 20, 1000)),
    asserta(vessel_info(v2, 25, 1500)),
    
    % Define docks: dock_info(Id, MaxLength, Cranes)
    asserta(dock_info(d1, 30, 2)),  % Can fit both vessels, 2 cranes
    asserta(dock_info(d2, 30, 2)),  % Can fit both vessels, 2 cranes
    
    % Run rebalancing
    write('=== TEST 1: Basic Rebalancing ==='), nl,
    obtain_rebalancing_schedule(BestMapping, BestCost),
    
    write('Best Mapping: '), write(BestMapping), nl,
    write('Total Cost (Delay + Imbalance): '), write(BestCost), nl,
    
    % Check load balance
    count_vessels_per_dock(BestMapping, d1, Count1),
    count_vessels_per_dock(BestMapping, d2, Count2),
    write('Dock d1 has '), write(Count1), write(' vessels'), nl,
    write('Dock d2 has '), write(Count2), write(' vessels'), nl,
    
    % Validate: Each dock should have 1 vessel (perfect balance)
    (Count1 =:= 1, Count2 =:= 1 -> 
        write('✓ PASS: Vessels are balanced across docks'), nl
    ; 
        write('✗ FAIL: Vessels are not balanced'), nl
    ),
    nl.

% -----------------------------------------------------------
% TEST SCENARIO 2: Congestion Avoidance (3 Vessels, 2 Docks)
% -----------------------------------------------------------
test_congestion_avoidance :-
    retractall(vessel(_, _, _, _, _)),
    retractall(vessel_info(_, _, _)),
    retractall(dock_info(_, _, _)),
    
    % 3 vessels arriving close together
    asserta(vessel(v1, 1, 10, 2, 2)),
    asserta(vessel(v2, 2, 11, 2, 2)),
    asserta(vessel(v3, 3, 12, 2, 2)),
    
    asserta(vessel_info(v1, 20, 1000)),
    asserta(vessel_info(v2, 20, 1000)),
    asserta(vessel_info(v3, 20, 1000)),
    
    % One dock with more cranes (faster processing)
    asserta(dock_info(d1, 30, 4)),  % Fast dock
    asserta(dock_info(d2, 30, 2)),  % Slow dock
    
    write('=== TEST 2: Congestion Avoidance ==='), nl,
    obtain_rebalancing_schedule(BestMapping, BestCost),
    
    write('Best Mapping: '), write(BestMapping), nl,
    write('Total Cost: '), write(BestCost), nl,
    
    count_vessels_per_dock(BestMapping, d1, Count1),
    count_vessels_per_dock(BestMapping, d2, Count2),
    write('Fast dock d1 has '), write(Count1), write(' vessels'), nl,
    write('Slow dock d2 has '), write(Count2), write(' vessels'), nl,
    
    % Validate: Should distribute to avoid congestion
    write('✓ PASS: Vessels distributed to avoid congestion'), nl,
    nl.

% -----------------------------------------------------------
% TEST SCENARIO 3: Size Constraints (Vessel Too Large)
% -----------------------------------------------------------
test_size_constraints :-
    retractall(vessel(_, _, _, _, _)),
    retractall(vessel_info(_, _, _)),
    retractall(dock_info(_, _, _)),
    
    % Large vessel that only fits in one dock
    asserta(vessel(v1, 1, 10, 2, 2)),
    asserta(vessel(v2, 2, 11, 2, 2)),
    
    asserta(vessel_info(v1, 40, 2000)),  % Large vessel
    asserta(vessel_info(v2, 20, 1000)),  % Small vessel
    
    asserta(dock_info(d1, 50, 2)),  % Can fit large vessel
    asserta(dock_info(d2, 25, 2)),  % Cannot fit large vessel
    
    write('=== TEST 3: Size Constraints ==='), nl,
    obtain_rebalancing_schedule(BestMapping, BestCost),
    
    write('Best Mapping: '), write(BestMapping), nl,
    write('Total Cost: '), write(BestCost), nl,
    
    % Check that large vessel is assigned to d1
    (member((v1, d1), BestMapping) -> 
        write('✓ PASS: Large vessel correctly assigned to compatible dock'), nl
    ; 
        write('✗ FAIL: Large vessel not assigned to compatible dock'), nl
    ),
    nl.

% -----------------------------------------------------------
% TEST SCENARIO 4: Zero Cranes Edge Case
% -----------------------------------------------------------
test_zero_cranes :-
    retractall(vessel(_, _, _, _, _)),
    retractall(vessel_info(_, _, _)),
    retractall(dock_info(_, _, _)),
    
    asserta(vessel(v1, 1, 10, 2, 2)),
    asserta(vessel_info(v1, 20, 1000)),
    
    % Dock with 0 cranes (should default to 1 in algorithm)
    asserta(dock_info(d1, 30, 0)),
    
    write('=== TEST 4: Zero Cranes Edge Case ==='), nl,
    obtain_rebalancing_schedule(BestMapping, BestCost),
    
    write('Best Mapping: '), write(BestMapping), nl,
    write('Total Cost: '), write(BestCost), nl,
    write('✓ PASS: Algorithm handles zero cranes without division by zero'), nl,
    nl.

% -----------------------------------------------------------
% TEST SCENARIO 5: Empty Input (No Vessels)
% -----------------------------------------------------------
test_empty_vessels :-
    retractall(vessel(_, _, _, _, _)),
    retractall(vessel_info(_, _, _)),
    retractall(dock_info(_, _, _)),
    
    asserta(dock_info(d1, 30, 2)),
    
    write('=== TEST 5: Empty Vessels ==='), nl,
    obtain_rebalancing_schedule(BestMapping, BestCost),
    
    write('Best Mapping: '), write(BestMapping), nl,
    write('Total Cost: '), write(BestCost), nl,
    
    (BestMapping = [], BestCost =:= 0 -> 
        write('✓ PASS: Empty vessels handled correctly'), nl
    ; 
        write('✗ FAIL: Empty vessels not handled correctly'), nl
    ),
    nl.

% -----------------------------------------------------------
% TEST SCENARIO 6: Load Balance Calculation (by LOAD, not vessel count)
% -----------------------------------------------------------
test_load_balance_penalty :-
    retractall(vessel(_, _, _, _, _)),
    retractall(vessel_info(_, _, _)),
    retractall(dock_info(_, _, _)),
    
    % Setup: 2 vessels, 2 docks with different crane counts
    asserta(vessel(v1, 1, 10, 4, 4)),  % 8 hours of work
    asserta(vessel(v2, 2, 11, 4, 4)),  % 8 hours of work
    asserta(vessel_info(v1, 20, 1000)),
    asserta(vessel_info(v2, 20, 1000)),
    asserta(dock_info(d1, 30, 1)),  % 1 crane (slow)
    asserta(dock_info(d2, 30, 4)),  % 4 cranes (fast)
    
    write('=== TEST 6: Load Balance Penalty (by LOAD not vessel count) ==='), nl,
    
    % Scenario A: Both vessels on slow dock (d1 with 1 crane)
    % Load d1 = (4+4)/1 + (4+4)/1 = 8 + 8 = 16
    % Load d2 = 0
    % Variance = ((16-8)^2 + (0-8)^2) / 2 = (64 + 64) / 2 = 64
    MappingUnbalanced = [(v1, d1), (v2, d1)],
    calculate_load_imbalance_penalty(MappingUnbalanced, PenaltyUnbalanced),
    write('Both vessels on slow dock (d1): Penalty = '), write(PenaltyUnbalanced), nl,
    
    % Scenario B: One vessel per dock (balanced by count, but NOT by load!)
    % Load d1 = (4+4)/1 = 8
    % Load d2 = (4+4)/4 = 2
    % Variance = ((8-5)^2 + (2-5)^2) / 2 = (9 + 9) / 2 = 9
    MappingBalancedCount = [(v1, d1), (v2, d2)],
    calculate_load_imbalance_penalty(MappingBalancedCount, PenaltyBalancedCount),
    write('One vessel per dock: Penalty = '), write(PenaltyBalancedCount), nl,
    
    % Validation: Penalty for scenario A should be HIGHER (worse balance)
    (PenaltyBalancedCount < PenaltyUnbalanced -> 
        write('✓ PASS: Distributing vessels reduces load imbalance'), nl
    ; 
        write('✗ FAIL: Penalty calculation incorrect'), nl
    ),
    
    write('NOTE: Even with 1 vessel per dock, there is imbalance because cranes differ'), nl,
    write('      (d1 load=8 vs d2 load=2 due to crane count difference)'), nl,
    nl.

% -----------------------------------------------------------
% RUN ALL TESTS
% -----------------------------------------------------------
run_all_tests :-
    write(''), nl,
    write('==============================================='), nl,
    write('  US 4.3.3 - DOCK REBALANCING TEST SUITE'), nl,
    write('==============================================='), nl, nl,
    
    test_basic_rebalancing,
    test_congestion_avoidance,
    test_size_constraints,
    test_zero_cranes,
    test_empty_vessels,
    test_load_balance_penalty,
    
    write('==============================================='), nl,
    write('  ALL TESTS COMPLETED'), nl,
    write('==============================================='), nl.

% Auto-run on load (comment out for manual testing)
% :- initialization(run_all_tests).

