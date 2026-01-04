% ===========================================================
% Test file for US 4.3.3 - DOCK REBALANCING (Logic Search)
% Full stress suite: Small, Medium, Large, Extreme & Ultra
% ===========================================================

:- consult('rebalancing_scheduling.pl').

% -------------------------------------------------
% AUXILIARY: Data Generation
% -------------------------------------------------

clean_data :-
    retractall(vessel(_, _, _, _, _)),
    retractall(vessel_info(_, _, _)),
    retractall(dock_info(_, _, _)).

% Setup padrão conforme as tuas tabelas (D=4)
setup_standard_docks :-
    clean_data,
    asserta(dock_info(d1, 500, 1)), % Poucas gruas
    asserta(dock_info(d2, 500, 2)), 
    asserta(dock_info(d3, 500, 4)), % Alta performance
    asserta(dock_info(d4, 500, 2)).

% Gerador automático de N navios compatíveis
generate_stress_vessels(N) :-
    forall(between(1, N, I),
        (   atom_concat(v, I, VId),
            Arrival is I mod 5,
            Due is Arrival + 15 + (I mod 10),
            Unl is 5 + (I mod 5),
            Ld is 5 + (I mod 5),
            Len is 50, % Navios pequenos para caberem em todas as docas
            asserta(vessel(VId, Arrival, Due, Unl, Ld)),
            asserta(vessel_info(VId, Len, 1000))
        )).

% -------------------------------------------------
% CORE TEST RUNNER (With TIMEOUT control)
% -------------------------------------------------

run_bench(N, TestID, Label) :-
    setup_standard_docks,
    generate_stress_vessels(N),
    format('--- Test ~w (~w): N=~w, D=4 ---~n', [TestID, Label, N]),
    get_time(T1),
    % Timeout de 60 segundos para evitar bloqueios em testes extremos
    (   catch(call_with_time_limit(60, obtain_rebalancing_schedule(_, BestCost)), 
              time_limit_exceeded, 
              Result = timeout)
    ),
    get_time(T2),
    Time is T2 - T1,
    (   Result == timeout -> 
        format('Result: [TIMEOUT] - Search space 4^~w is too vast!~n~n', [N])
    ;   format('Cost: ~w | Time: ~4f s~n~n', [BestCost, Time])
    ).

% -------------------------------------------------
% SCENARIOS ACCORDING TO YOUR TABLES
% -------------------------------------------------

% 4.1 Small-Scale Validation
run_small_tests :-
    run_bench(3, '1-4', 'Baseline Correctness'),
    run_bench(5, '5', 'Logic Search'),
    run_bench(7, '6', 'Logic Search'),
    run_bench(10, '7', 'Stress Threshold').

% 4.2 Medium-Scale (The Breaking Point)
run_medium_tests :-
    run_bench(15, '8', 'Critical Slowdown'),
    run_bench(20, '9', 'Practical Limit').

% 4.3 to 4.5 Large, Extreme & Ultra-Extreme
run_extreme_demonstrations :-
    write('Executing Large to Ultra-Extreme demonstrations...'), nl,
    run_bench(30, '10', 'Large-Scale'),
    run_bench(100, '13', 'Extreme Stress'),
    run_bench(1000, '18', 'Ultra-Extreme'),
    run_bench(10000, '21', 'Impossible Zone').

% -------------------------------------------------
% MASTER RUNNER
% -------------------------------------------------

run_all_rebalancing_tests :-
    write('========================================'), nl,
    write('US 4.3.3 LOGIC SEARCH FULL TEST SUITE'), nl,
    write('========================================'), nl, nl,
    run_small_tests,
    run_medium_tests,
    run_extreme_demonstrations,
    write('--- End of Test Suite ---'), nl.