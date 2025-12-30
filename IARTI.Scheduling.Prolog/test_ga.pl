% Test file for GA Scheduling
% This tests the ga_scheduling.pl algorithm directly

:- consult('ga_scheduling.pl').

% Test 1: Simple 3-vessel scenario
test_ga_simple :-
    write('=== TEST 1: Simple 3-vessel GA Test ==='), nl,
    % Clear any existing vessel facts
    retractall(vessel(_, _, _, _, _)),
    
    % Add test vessels
    asserta(vessel(v1, 0, 10, 2, 2)),   % Arrival=0, Departure=10, Unload=2, Load=2
    asserta(vessel(v2, 1, 12, 3, 3)),   % Arrival=1, Departure=12, Unload=3, Load=3
    asserta(vessel(v3, 2, 15, 1, 1)),   % Arrival=2, Departure=15, Unload=1, Load=1
    
    % Set GA parameters
    retractall(generations(_)), asserta(generations(20)),
    retractall(population(_)), asserta(population(10)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.2)),
    
    % Run GA
    write('Running GA with 3 vessels...'), nl,
    get_time(T1),
    obtain_genetic_schedule(BestSeq, BestDelay),
    get_time(T2),
    Time is T2 - T1,
    
    % Print results
    write('Best Sequence: '), write(BestSeq), nl,
    write('Best Delay: '), write(BestDelay), nl,
    write('Execution Time: '), write(Time), write(' seconds'), nl,
    nl,
    
    % Clean up
    retractall(vessel(_, _, _, _, _)).

% Test 2: Test with different population sizes
test_ga_population_sizes :-
    write('=== TEST 2: Testing Different Population Sizes ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    
    % Add test vessels
    asserta(vessel(v1, 0, 8, 2, 2)),
    asserta(vessel(v2, 1, 10, 2, 2)),
    asserta(vessel(v3, 2, 12, 2, 2)),
    
    % Test with PopSize=5
    write('Population Size = 5:'), nl,
    retractall(population(_)), asserta(population(5)),
    retractall(generations(_)), asserta(generations(10)),
    get_time(T1),
    obtain_genetic_schedule(Seq1, Delay1),
    get_time(T2),
    Time1 is T2 - T1,
    write('  Delay: '), write(Delay1), write(', Time: '), write(Time1), write('s'), nl,
    
    % Test with PopSize=20
    write('Population Size = 20:'), nl,
    retractall(population(_)), asserta(population(20)),
    retractall(generations(_)), asserta(generations(10)),
    get_time(T3),
    obtain_genetic_schedule(Seq2, Delay2),
    get_time(T4),
    Time2 is T4 - T3,
    write('  Delay: '), write(Delay2), write(', Time: '), write(Time2), write('s'), nl,
    
    % Test with PopSize=50
    write('Population Size = 50:'), nl,
    retractall(population(_)), asserta(population(50)),
    retractall(generations(_)), asserta(generations(10)),
    get_time(T5),
    obtain_genetic_schedule(Seq3, Delay3),
    get_time(T6),
    Time3 is T6 - T5,
    write('  Delay: '), write(Delay3), write(', Time: '), write(Time3), write('s'), nl,
    nl,
    
    retractall(vessel(_, _, _, _, _)).

% Test 3: Test with different generation counts
test_ga_generations :-
    write('=== TEST 3: Testing Different Generation Counts ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    
    asserta(vessel(v1, 0, 8, 2, 2)),
    asserta(vessel(v2, 1, 10, 2, 2)),
    asserta(vessel(v3, 2, 12, 2, 2)),
    
    retractall(population(_)), asserta(population(20)),
    
    % Test with 10 generations
    write('Generations = 10:'), nl,
    retractall(generations(_)), asserta(generations(10)),
    get_time(T1),
    obtain_genetic_schedule(_, Delay1),
    get_time(T2),
    Time1 is T2 - T1,
    write('  Delay: '), write(Delay1), write(', Time: '), write(Time1), write('s'), nl,
    
    % Test with 50 generations
    write('Generations = 50:'), nl,
    retractall(generations(_)), asserta(generations(50)),
    get_time(T3),
    obtain_genetic_schedule(_, Delay2),
    get_time(T4),
    Time2 is T4 - T3,
    write('  Delay: '), write(Delay2), write(', Time: '), write(Time2), write('s'), nl,
    
    % Test with 100 generations
    write('Generations = 100:'), nl,
    retractall(generations(_)), asserta(generations(100)),
    get_time(T5),
    obtain_genetic_schedule(_, Delay3),
    get_time(T6),
    Time3 is T6 - T5,
    write('  Delay: '), write(Delay3), write(', Time: '), write(Time3), write('s'), nl,
    nl,
    
    retractall(vessel(_, _, _, _, _)).

% Test 4: Compare GA with optimal (brute force) for small dataset
test_ga_vs_optimal :-
    write('=== TEST 4: GA vs Optimal (Brute Force) Comparison ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    
    % Small dataset (3 vessels) - we can compute optimal
    asserta(vessel(v1, 0, 10, 2, 2)),
    asserta(vessel(v2, 1, 12, 3, 3)),
    asserta(vessel(v3, 2, 15, 1, 1)),
    
    % Find optimal by brute force
    write('Computing optimal solution (brute force)...'), nl,
    findall(V, vessel(V, _, _, _, _), Vessels),
    findall(Perm-Delay, (permutation(Vessels, Perm), evaluate(Perm, Delay)), AllPerms),
    sort(2, @=<, AllPerms, SortedPerms),
    SortedPerms = [OptimalPerm-OptimalDelay | _],
    write('  Optimal Sequence: '), write(OptimalPerm), nl,
    write('  Optimal Delay: '), write(OptimalDelay), nl,
    
    % Run GA
    write('Computing GA solution...'), nl,
    retractall(population(_)), asserta(population(20)),
    retractall(generations(_)), asserta(generations(50)),
    obtain_genetic_schedule(GASeq, GADelay),
    write('  GA Sequence: '), write(GASeq), nl,
    write('  GA Delay: '), write(GADelay), nl,
    
    % Compare results
    (GADelay =< OptimalDelay -> 
        write('✓ GA found optimal solution!'), nl
    ; 
        Diff is GADelay - OptimalDelay,
        Pct is (Diff / OptimalDelay) * 100,
        format('✗ GA solution is ~2f% worse than optimal~n', [Pct])
    ),
    nl,
    
    retractall(vessel(_, _, _, _, _)).

% Test 5: Real scenario with your actual vessels
test_ga_real_vessels :-
    write('=== TEST 5: Real Vessel Scenario ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    
    % Use your real vessel data
    asserta(vessel('VVN-4e8EJNoahO', 0, 8, 12, 12)),
    asserta(vessel('VVN-GuwWW_S4kU', 0, 32, 12, 12)),
    asserta(vessel('VVN-MUUBWxTsek', 0, 56, 12, 12)),
    
    write('Testing with real vessels (VVN-4e8EJNoahO, VVN-GuwWW_S4kU, VVN-MUUBWxTsek)'), nl,
    
    % Test Fast preset (30 pop, 50 gen)
    write('Fast preset (30 pop, 50 gen):'), nl,
    retractall(population(_)), asserta(population(30)),
    retractall(generations(_)), asserta(generations(50)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.3)),
    get_time(T1),
    obtain_genetic_schedule(SeqFast, DelayFast),
    get_time(T2),
    TimeFast is T2 - T1,
    write('  Delay: '), write(DelayFast), write(', Time: '), write(TimeFast), write('s'), nl,
    
    % Test Balanced preset (50 pop, 100 gen)
    write('Balanced preset (50 pop, 100 gen):'), nl,
    retractall(population(_)), asserta(population(50)),
    retractall(generations(_)), asserta(generations(100)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.2)),
    get_time(T3),
    obtain_genetic_schedule(SeqBalanced, DelayBalanced),
    get_time(T4),
    TimeBalanced is T4 - T3,
    write('  Delay: '), write(DelayBalanced), write(', Time: '), write(TimeBalanced), write('s'), nl,
    
    % Test Quality preset (100 pop, 200 gen)
    write('Quality preset (100 pop, 200 gen):'), nl,
    retractall(population(_)), asserta(population(100)),
    retractall(generations(_)), asserta(generations(200)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.15)),
    get_time(T5),
    obtain_genetic_schedule(SeqQuality, DelayQuality),
    get_time(T6),
    TimeQuality is T6 - T5,
    write('  Delay: '), write(DelayQuality), write(', Time: '), write(TimeQuality), write('s'), nl,
    
    write('Time comparison: Fast='), write(TimeFast), write('s, Balanced='), write(TimeBalanced), write('s, Quality='), write(TimeQuality), write('s'), nl,
    nl,
    
    retractall(vessel(_, _, _, _, _)).

% Test 6: Test with 5 vessels (forces GA usage)
test_ga_5_vessels :-
    write('=== TEST 6: 5 Vessels - GA is forced to run ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    
    % Add 5 vessels with varying arrival times and service times
    asserta(vessel(v1, 0, 15, 3, 3)),   % Arrival=0, Departure=15, Service=6
    asserta(vessel(v2, 2, 18, 4, 4)),   % Arrival=2, Departure=18, Service=8
    asserta(vessel(v3, 5, 22, 2, 2)),   % Arrival=5, Departure=22, Service=4
    asserta(vessel(v4, 8, 25, 3, 3)),   % Arrival=8, Departure=25, Service=6
    asserta(vessel(v5, 10, 30, 2, 2)),  % Arrival=10, Departure=30, Service=4
    
    write('Testing with 5 vessels - now GA will actually run!'), nl,
    
    % Test Fast preset (30 pop, 50 gen)
    write('Fast preset (30 pop, 50 gen):'), nl,
    retractall(population(_)), asserta(population(30)),
    retractall(generations(_)), asserta(generations(50)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.7)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.3)),
    get_time(T1),
    obtain_genetic_schedule(SeqFast, DelayFast),
    get_time(T2),
    TimeFast is T2 - T1,
    write('  Sequence: '), write(SeqFast), nl,
    write('  Delay: '), write(DelayFast), write(', Time: '), write(TimeFast), write('s'), nl,
    
    % Test Balanced preset (50 pop, 100 gen)
    write('Balanced preset (50 pop, 100 gen):'), nl,
    retractall(population(_)), asserta(population(50)),
    retractall(generations(_)), asserta(generations(100)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.2)),
    get_time(T3),
    obtain_genetic_schedule(SeqBalanced, DelayBalanced),
    get_time(T4),
    TimeBalanced is T4 - T3,
    write('  Sequence: '), write(SeqBalanced), nl,
    write('  Delay: '), write(DelayBalanced), write(', Time: '), write(TimeBalanced), write('s'), nl,
    
    % Test Quality preset (100 pop, 200 gen)
    write('Quality preset (100 pop, 200 gen):'), nl,
    retractall(population(_)), asserta(population(100)),
    retractall(generations(_)), asserta(generations(200)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.15)),
    get_time(T5),
    obtain_genetic_schedule(SeqQuality, DelayQuality),
    get_time(T6),
    TimeQuality is T6 - T5,
    write('  Sequence: '), write(SeqQuality), nl,
    write('  Delay: '), write(DelayQuality), write(', Time: '), write(TimeQuality), write('s'), nl,
    
    write('⏱️  Time comparison: Fast='), write(TimeFast), write('s, Balanced='), write(TimeBalanced), write('s, Quality='), write(TimeQuality), write('s'), nl,
    write('🎯 Delay comparison: Fast='), write(DelayFast), write(', Balanced='), write(DelayBalanced), write(', Quality='), write(DelayQuality), nl,
    nl,
    
    retractall(vessel(_, _, _, _, _)).

% Test 7: Test with 7 vessels (medium complexity)
test_ga_7_vessels :-
    write('=== TEST 7: 7 Vessels - Medium Complexity ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    
    % Add 7 vessels with more complex scheduling requirements
    asserta(vessel(v1, 0, 20, 4, 4)),   % Service=8
    asserta(vessel(v2, 3, 25, 3, 3)),   % Service=6
    asserta(vessel(v3, 6, 28, 5, 5)),   % Service=10
    asserta(vessel(v4, 10, 35, 2, 2)),  % Service=4
    asserta(vessel(v5, 12, 38, 4, 4)),  % Service=8
    asserta(vessel(v6, 15, 42, 3, 3)),  % Service=6
    asserta(vessel(v7, 18, 48, 2, 2)),  % Service=4
    
    write('Testing with 7 vessels - seeing GA evolution!'), nl,
    
    % Test Fast preset
    write('Fast preset (30 pop, 50 gen):'), nl,
    retractall(population(_)), asserta(population(30)),
    retractall(generations(_)), asserta(generations(50)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.7)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.3)),
    get_time(T1),
    obtain_genetic_schedule(SeqFast, DelayFast),
    get_time(T2),
    TimeFast is T2 - T1,
    write('  Delay: '), write(DelayFast), write(', Time: '), write(TimeFast), write('s'), nl,
    
    % Test Balanced preset
    write('Balanced preset (50 pop, 100 gen):'), nl,
    retractall(population(_)), asserta(population(50)),
    retractall(generations(_)), asserta(generations(100)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.2)),
    get_time(T3),
    obtain_genetic_schedule(SeqBalanced, DelayBalanced),
    get_time(T4),
    TimeBalanced is T4 - T3,
    write('  Delay: '), write(DelayBalanced), write(', Time: '), write(TimeBalanced), write('s'), nl,
    
    % Test Quality preset
    write('Quality preset (100 pop, 200 gen):'), nl,
    retractall(population(_)), asserta(population(100)),
    retractall(generations(_)), asserta(generations(200)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.15)),
    get_time(T5),
    obtain_genetic_schedule(SeqQuality, DelayQuality),
    get_time(T6),
    TimeQuality is T6 - T5,
    write('  Delay: '), write(DelayQuality), write(', Time: '), write(TimeQuality), write('s'), nl,
    
    write('⏱️  Time comparison: Fast='), write(TimeFast), write('s, Balanced='), write(TimeBalanced), write('s, Quality='), write(TimeQuality), write('s'), nl,
    write('🎯 Delay comparison: Fast='), write(DelayFast), write(', Balanced='), write(DelayBalanced), write(', Quality='), write(DelayQuality), nl,
    
    % Calculate improvement percentages
    (DelayFast > 0 -> 
        (DelayQuality < DelayFast -> 
            ImprovementPct is ((DelayFast - DelayQuality) / DelayFast) * 100,
            format('📊 Quality improved delay by ~2f% compared to Fast~n', [ImprovementPct])
        ; 
            write('📊 Fast found similar or better solution')
        ), nl
    ; true),
    
    retractall(vessel(_, _, _, _, _)).

% Test 8: Test with 10 vessels (high complexity)
test_ga_10_vessels :-
    write('=== TEST 8: 10 Vessels - High Complexity ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    
    % Add 10 vessels with high complexity
    asserta(vessel(v1, 0, 25, 5, 5)),    % Service=10
    asserta(vessel(v2, 2, 28, 4, 4)),    % Service=8
    asserta(vessel(v3, 5, 32, 6, 6)),    % Service=12
    asserta(vessel(v4, 8, 35, 3, 3)),    % Service=6
    asserta(vessel(v5, 10, 40, 5, 5)),   % Service=10
    asserta(vessel(v6, 12, 45, 4, 4)),   % Service=8
    asserta(vessel(v7, 15, 50, 3, 3)),   % Service=6
    asserta(vessel(v8, 18, 55, 5, 5)),   % Service=10
    asserta(vessel(v9, 20, 60, 4, 4)),   % Service=8
    asserta(vessel(v10, 22, 65, 3, 3)),  % Service=6
    
    write('Testing with 10 vessels - GA at full power!'), nl,
    write('(10! = 3,628,800 possible permutations - brute force is impractical)'), nl,
    
    % Test Fast preset
    write('🚀 Fast preset (30 pop, 50 gen):'), nl,
    retractall(population(_)), asserta(population(30)),
    retractall(generations(_)), asserta(generations(50)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.7)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.3)),
    get_time(T1),
    obtain_genetic_schedule(SeqFast, DelayFast),
    get_time(T2),
    TimeFast is T2 - T1,
    write('  Delay: '), write(DelayFast), write(', Time: '), write(TimeFast), write('s'), nl,
    
    % Test Balanced preset
    write('⚖️  Balanced preset (50 pop, 100 gen):'), nl,
    retractall(population(_)), asserta(population(50)),
    retractall(generations(_)), asserta(generations(100)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.2)),
    get_time(T3),
    obtain_genetic_schedule(SeqBalanced, DelayBalanced),
    get_time(T4),
    TimeBalanced is T4 - T3,
    write('  Delay: '), write(DelayBalanced), write(', Time: '), write(TimeBalanced), write('s'), nl,
    
    % Test Quality preset
    write('💎 Quality preset (100 pop, 200 gen):'), nl,
    retractall(population(_)), asserta(population(100)),
    retractall(generations(_)), asserta(generations(200)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.15)),
    get_time(T5),
    obtain_genetic_schedule(SeqQuality, DelayQuality),
    get_time(T6),
    TimeQuality is T6 - T5,
    write('  Delay: '), write(DelayQuality), write(', Time: '), write(TimeQuality), write('s'), nl,
    nl,
    
    write('⏱️  Time comparison: Fast='), write(TimeFast), write('s, Balanced='), write(TimeBalanced), write('s, Quality='), write(TimeQuality), write('s'), nl,
    write('🎯 Delay comparison: Fast='), write(DelayFast), write(', Balanced='), write(DelayBalanced), write(', Quality='), write(DelayQuality), nl,
    
    % Calculate improvements
    (DelayFast > 0 -> 
        (DelayBalanced < DelayFast -> 
            Imp1 is ((DelayFast - DelayBalanced) / DelayFast) * 100,
            format('📊 Balanced improved by ~2f% vs Fast~n', [Imp1])
        ; true),
        (DelayQuality < DelayFast -> 
            Imp2 is ((DelayFast - DelayQuality) / DelayFast) * 100,
            format('📊 Quality improved by ~2f% vs Fast~n', [Imp2])
        ; true),
        (DelayQuality < DelayBalanced -> 
            Imp3 is ((DelayBalanced - DelayQuality) / DelayBalanced) * 100,
            format('📊 Quality improved by ~2f% vs Balanced~n', [Imp3])
        ; true)
    ; true),
    nl,
    
    retractall(vessel(_, _, _, _, _)).

% Run all tests
run_all_tests :-
    write('========================================'), nl,
    write('   GA SCHEDULING ALGORITHM TESTS'), nl,
    write('========================================'), nl, nl,
    test_ga_simple,
    test_ga_population_sizes,
    test_ga_generations,
    test_ga_vs_optimal,
    test_ga_real_vessels,
    write('========================================'), nl,
    write('   ALL TESTS COMPLETED'), nl,
    write('========================================'), nl.

% Run tests with large datasets (5-10 vessels)
run_large_dataset_tests :-
    write('========================================'), nl,
    write('   GA LARGE DATASET TESTS (5-10 vessels)'), nl,
    write('========================================'), nl, nl,
    test_ga_5_vessels,
    test_ga_7_vessels,
    test_ga_10_vessels,
    write('========================================'), nl,
    write('   LARGE DATASET TESTS COMPLETED'), nl,
    write('========================================'), nl.
