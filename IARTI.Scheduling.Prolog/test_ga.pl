% ========================================
% Test file for GA Scheduling
% Full functional + stress + inefficiency tests
% ========================================

:- consult('ga_scheduling.pl').

% -------------------------------------------------
% AUXILIARY: Generate vessels automatically (stress)
% -------------------------------------------------

generate_stress_vessels(N) :-
    retractall(vessel(_, _, _, _, _)),
    forall(
        between(1, N, I),
        (
            Arrival is I mod 5,
            Due is Arrival + 20 + (I mod 10),
            Load is 4 + (I mod 4),
            Unload is 4 + (I mod 4),
            atom_concat(v, I, Id),
            asserta(vessel(Id, Arrival, Due, Load, Unload))
        )
    ).

% -------------------------------------------------
% TEST 1: Simple correctness test
% -------------------------------------------------

test_ga_simple :-
    write('=== TEST 1: Simple 3-vessel GA Test ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    asserta(vessel(v1, 0, 10, 2, 2)),
    asserta(vessel(v2, 1, 12, 3, 3)),
    asserta(vessel(v3, 2, 15, 1, 1)),
    retractall(generations(_)), asserta(generations(20)),
    retractall(population(_)), asserta(population(10)),
    retractall(prob_crossover(_)), asserta(prob_crossover(0.6)),
    retractall(prob_mutation(_)), asserta(prob_mutation(0.2)),
    get_time(T1),
    obtain_genetic_schedule(Seq, Delay),
    get_time(T2),
    Time is T2 - T1,
    write('Sequence: '), write(Seq), nl,
    write('Delay: '), write(Delay), nl,
    write('Time: '), write(Time), write('s'), nl, nl.

% -------------------------------------------------
% TEST 2: Population size impact
% -------------------------------------------------

test_ga_population_sizes :-
    write('=== TEST 2: Population Size Impact ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    asserta(vessel(v1, 0, 8, 2, 2)),
    asserta(vessel(v2, 1, 10, 2, 2)),
    asserta(vessel(v3, 2, 12, 2, 2)),
    forall(
        member(Pop, [5,20,50]),
        (
            retractall(population(_)), asserta(population(Pop)),
            retractall(generations(_)), asserta(generations(10)),
            get_time(T1),
            obtain_genetic_schedule(_, Delay),
            get_time(T2),
            Time is T2 - T1,
            format('Pop=~w -> Delay=~w, Time=~2f s~n', [Pop, Delay, Time])
        )
    ),
    nl.

% -------------------------------------------------
% TEST 3: Generations impact
% -------------------------------------------------

test_ga_generations :-
    write('=== TEST 3: Generations Impact ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    asserta(vessel(v1, 0, 8, 2, 2)),
    asserta(vessel(v2, 1, 10, 2, 2)),
    asserta(vessel(v3, 2, 12, 2, 2)),
    retractall(population(_)), asserta(population(20)),
    forall(
        member(Gen, [10,50,100]),
        (
            retractall(generations(_)), asserta(generations(Gen)),
            get_time(T1),
            obtain_genetic_schedule(_, Delay),
            get_time(T2),
            Time is T2 - T1,
            format('Gen=~w -> Delay=~w, Time=~2f s~n', [Gen, Delay, Time])
        )
    ),
    nl.

% -------------------------------------------------
% TEST 4: GA vs Optimal (Brute Force)
% -------------------------------------------------

test_ga_vs_optimal :-
    write('=== TEST 4: GA vs Optimal ==='), nl,
    retractall(vessel(_, _, _, _, _)),
    asserta(vessel(v1, 0, 10, 2, 2)),
    asserta(vessel(v2, 1, 12, 3, 3)),
    asserta(vessel(v3, 2, 15, 1, 1)),
    findall(V, vessel(V,_,_,_,_), Vs),
    findall(P-D, (permutation(Vs,P), evaluate(P,D)), L),
    sort(2,@=<,L,[OptSeq-OptDelay|_]),
    write('Optimal Delay: '), write(OptDelay), nl,
    obtain_genetic_schedule(_, GADelay),
    write('GA Delay: '), write(GADelay), nl,
    nl.

% -------------------------------------------------
% TEST 5–8: Increasing complexity
% -------------------------------------------------

test_ga_5_vessels :-
    write('=== TEST 5: 5 Vessels ==='), nl,
    generate_stress_vessels(5),
    retractall(population(_)), asserta(population(30)),
    retractall(generations(_)), asserta(generations(50)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s~n~n', [D, T2-T1]).

test_ga_7_vessels :-
    write('=== TEST 6: 7 Vessels ==='), nl,
    generate_stress_vessels(7),
    retractall(population(_)), asserta(population(50)),
    retractall(generations(_)), asserta(generations(100)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s~n~n', [D, T2-T1]).

test_ga_10_vessels :-
    write('=== TEST 7: 10 Vessels ==='), nl,
    generate_stress_vessels(10),
    retractall(population(_)), asserta(population(100)),
    retractall(generations(_)), asserta(generations(200)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s~n~n', [D, T2-T1]).

% -------------------------------------------------
% TEST 9–11: INEFFICIENCY DEMONSTRATION
% -------------------------------------------------

test_ga_15_vessels :-
    write('=== TEST 8: 15 Vessels (Stress Threshold) ==='), nl,
    generate_stress_vessels(15),
    retractall(population(_)), asserta(population(100)),
    retractall(generations(_)), asserta(generations(200)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s ⚠️~n~n', [D, T2-T1]).

test_ga_20_vessels :-
    write('=== TEST 9: 20 Vessels (Inefficient) ==='), nl,
    generate_stress_vessels(20),
    retractall(population(_)), asserta(population(150)),
    retractall(generations(_)), asserta(generations(300)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s ❌~n~n', [D, T2-T1]).

test_ga_30_vessels :-
    write('=== TEST 10: 30 Vessels (Impractical) ==='), nl,
    generate_stress_vessels(30),
    retractall(population(_)), asserta(population(200)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s ❌❌~n~n', [D, T2-T1]).

test_ga_40_vessels :-
    write('=== TEST 11: 40 Vessels (Extreme Stress) ==='), nl,
    generate_stress_vessels(40),
    retractall(population(_)), asserta(population(200)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s 🔥🔥~n~n', [D, T2-T1]).

test_ga_50_vessels :-
    write('=== TEST 12: 50 Vessels (Critical Load) ==='), nl,
    generate_stress_vessels(50),
    retractall(population(_)), asserta(population(250)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s 💀💀~n~n', [D, T2-T1]).

test_ga_100_vessels :-
    write('=== TEST 13: 100 Vessels (Still Running) ==='), nl,
    generate_stress_vessels(100),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s 💥~n~n', [D, T2-T1]).

test_ga_150_vessels :-
    write('=== TEST 14: 150 Vessels (CRITICAL) ==='), nl,
    generate_stress_vessels(150),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s 💥💥~n~n', [D, T2-T1]).

test_ga_200_vessels :-
    write('=== TEST 15: 200 Vessels (EXTREME) ==='), nl,
    generate_stress_vessels(200),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s 💥💥💥~n~n', [D, T2-T1]).

test_ga_300_vessels :-
    write('=== TEST 16: 300 Vessels (INSANE) ==='), nl,
    generate_stress_vessels(300),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    format('Delay=~w Time=~2f s ☠️☠️☠️~n~n', [D, T2-T1]).

test_ga_500_vessels :-
    write('=== TEST 17: 500 Vessels (Still Running!) ==='), nl,
    generate_stress_vessels(500),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    Time is T2 - T1,
    Minutes is Time / 60,
    format('Delay=~w Time=~2f s (~2f min) ⚰️~n~n', [D, Time, Minutes]).

test_ga_1000_vessels :-
    write('=== TEST 18: 1000 Vessels (EXTREME LIMIT) ==='), nl,
    write('Expected time: 3-6 hours or timeout'), nl,
    generate_stress_vessels(1000),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    Time is T2 - T1,
    Minutes is Time / 60,
    Hours is Minutes / 60,
    format('Delay=~w Time=~2f s (~2f min, ~2f hours) 💀💀💀~n~n', [D, Time, Minutes, Hours]).

test_ga_2000_vessels :-
    write('=== TEST 19: 2000 Vessels (INSANITY LEVEL) ==='), nl,
    write('Expected time: 12-24 hours or memory crash'), nl,
    generate_stress_vessels(2000),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    Time is T2 - T1,
    Minutes is Time / 60,
    Hours is Minutes / 60,
    format('Delay=~w Time=~2f s (~2f min, ~2f hours) ☠️☠️☠️~n~n', [D, Time, Minutes, Hours]).

test_ga_5000_vessels :-
    write('=== TEST 20: 5000 Vessels (BEYOND COMPREHENSION) ==='), nl,
    write('Expected: Memory overflow or multi-day execution'), nl,
    generate_stress_vessels(5000),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    Time is T2 - T1,
    Minutes is Time / 60,
    Hours is Minutes / 60,
    Days is Hours / 24,
    format('Delay=~w Time=~2f s (~2f min, ~2f hours, ~2f days) 🔥🔥🔥🔥🔥~n~n', [D, Time, Minutes, Hours, Days]).

test_ga_10000_vessels :-
    write('=== TEST 21: 10000 Vessels (IMPOSSIBLE) ==='), nl,
    write('Expected: Almost certain failure - memory crash or weeks of execution'), nl,
    generate_stress_vessels(10000),
    retractall(population(_)), asserta(population(300)),
    retractall(generations(_)), asserta(generations(500)),
    get_time(T1),
    obtain_genetic_schedule(_, D),
    get_time(T2),
    Time is T2 - T1,
    Minutes is Time / 60,
    Hours is Minutes / 60,
    Days is Hours / 24,
    format('Delay=~w Time=~2f s (~2f min, ~2f hours, ~2f days) ⚰️⚰️⚰️⚰️⚰️⚰️~n~n', [D, Time, Minutes, Hours, Days]).

% -------------------------------------------------
% RUNNERS
% -------------------------------------------------

run_all_tests :-
    test_ga_simple,
    test_ga_population_sizes,
    test_ga_generations,
    test_ga_vs_optimal,
    test_ga_5_vessels,
    test_ga_7_vessels,
    test_ga_10_vessels.

run_large_dataset_tests :-
    test_ga_15_vessels,
    test_ga_20_vessels,
    test_ga_30_vessels.  % ⚠️ Heavy test - takes ~30s

run_extreme_stress_tests :-
    write('⚠️ WARNING: These tests may take several minutes!'), nl, nl,
    test_ga_40_vessels,
    test_ga_50_vessels.

run_breaking_point_test :-
    write('💀 DANGER: This test will push the algorithm to its limits!'), nl,
    write('This may take a very long time or fail completely.'), nl, nl,
    test_ga_100_vessels.

run_extreme_breaking_point_tests :-
    write('⚰️ EXTREME DANGER: Testing beyond practical limits!'), nl,
    write('These tests may take 10+ minutes EACH or crash!'), nl,
    write('Press Ctrl+C to abort if needed.'), nl, nl,
    test_ga_150_vessels,
    test_ga_200_vessels.

run_absolute_limit_test :-
    write('☠️☠️☠️ ABSOLUTE LIMIT TEST ☠️☠️☠️'), nl,
    write('This will likely take 30+ minutes or fail!'), nl,
    write('Only run if you want to see complete failure.'), nl, nl,
    test_ga_300_vessels.

run_insanity_test :-
    write('⚰️⚰️⚰️ INSANITY MODE ⚰️⚰️⚰️'), nl,
    write('500 vessels - This took 52 minutes!'), nl,
    write('You have been warned!'), nl, nl,
    test_ga_500_vessels.

run_ultra_extreme_tests :-
    write('🔥🔥🔥 ULTRA EXTREME TESTS 🔥🔥🔥'), nl,
    write('WARNING: These will take HOURS each!'), nl,
    write('1000 vessels: ~3-6 hours expected'), nl,
    write('2000 vessels: ~12-24 hours expected'), nl,
    write('Press Ctrl+C to abort!'), nl, nl,
    test_ga_1000_vessels,
    test_ga_2000_vessels.

run_impossible_test :-
    write('💀💀💀 IMPOSSIBLE ZONE 💀💀💀'), nl,
    write('5000 vessels: May take DAYS or crash'), nl,
    write('This is beyond practical limits!'), nl,
    write('Only run if you want to find the true breaking point!'), nl, nl,
    test_ga_5000_vessels.

run_absolute_death_test :-
    write('⚰️⚰️⚰️ ABSOLUTE DEATH TEST ⚰️⚰️⚰️'), nl,
    write('10000 vessels: Almost guaranteed to fail'), nl,
    write('Expected: Memory overflow, stack overflow, or weeks of execution'), nl,
    write('THIS WILL LIKELY CRASH YOUR SYSTEM!'), nl,
    write('Are you absolutely sure? Press Ctrl+C NOW if not!'), nl, nl,
    test_ga_10000_vessels.

run_complete_test_suite :-
    write('========================================'), nl,
    write('COMPLETE GA SCHEDULING TEST SUITE'), nl,
    write('========================================'), nl, nl,
    run_all_tests,
    write('--- Now running large dataset tests ---'), nl, nl,
    run_large_dataset_tests,
    write('--- Large dataset tests completed ---'), nl, nl.

