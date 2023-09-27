import { _, assert } from "spec.ts";
import { ExecuteRinha } from "./executor";
import { ParseRinha } from "./parser";

type Rinha<Source extends string> = ParseRinha<Source> extends infer Ast ? Ast extends { expression: any } ? ExecuteRinha<Ast> : Ast : never;
type RinhaValue<Source extends string> = Rinha<Source> extends infer Result ? Result extends { value: infer Value } ? Value : Result : never;
type RinhaStdOut<Source extends string> = Rinha<Source> extends infer Result ? Result extends { stdout: infer StdOut } ? StdOut : Result : never;

// Numbers:

assert(_ as RinhaValue<"1">, _ as 1);
assert(_ as RinhaValue<"-1">, _ as -1);
assert(_ as RinhaValue<"1+2">, _ as 3);
assert(_ as RinhaValue<"1+-2">, _ as -1);
assert(_ as RinhaValue<"1-2">, _ as -1);
assert(_ as RinhaValue<"1 + 2">, _ as 3);
assert(_ as RinhaValue<"1 + 2 * 3 + 4">, _ as 11);
assert(_ as RinhaValue<"1 + (2 * 3) + 4">, _ as 11);
assert(_ as RinhaValue<"(1 + 2) * (3 + 4)">, _ as 21);
assert(_ as RinhaValue<"  ( 1 + 2  ) \t* ( 3   + 4  \n\n ) ">, _ as 21);
assert(_ as RinhaValue<"(1+2)*(3+4)">, _ as 21);
assert(_ as RinhaValue<"-1*-1">, _ as 1);
assert(_ as RinhaValue<"1024 * 1024">, _ as 1048576);
assert(_ as RinhaValue<"1024 * 1024 * 1024">, _ as 1073741824);
assert(_ as RinhaValue<"1024 * 1024 * 1024 * 1024">, _ as 1099511627776);
assert(_ as RinhaValue<"1024 * 1024 * 1024 * 1024 * 1024">, _ as 1125899906842624);
assert(_ as RinhaValue<"1024 * 1024 * 1024 * 1024 * 1024 * 1024">, _ as 1152921504606846976n);
assert(_ as RinhaValue<"1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024">, _ as 1180591620717411303424n);
assert(_ as RinhaValue<"1180591620717411303424">, _ as 1180591620717411303424n);
assert(_ as RinhaStdOut<"print(10)">, _ as "10\n");
assert(_ as RinhaStdOut<"print(-14)">, _ as "-14\n");
assert(_ as RinhaStdOut<"print(1180591620717411303424)">, _ as "1180591620717411303424\n");

assert(_ as RinhaValue<"1+">, _ as { $error: "Expected end of string, but found '+'" });

// Logic:

assert(_ as RinhaValue<"1 + 2 == 3">, _ as true);
assert(_ as RinhaValue<"1 + 2 < 3">, _ as false);
assert(_ as RinhaValue<"1 + 2 < 4">, _ as true);
assert(_ as RinhaValue<"1 < 2">, _ as true);
assert(_ as RinhaValue<"1 <= 2">, _ as true);
assert(_ as RinhaValue<"2 <= 2">, _ as true);
assert(_ as RinhaValue<"3 <= 2">, _ as false);
assert(_ as RinhaValue<"3 >= 2">, _ as true);
assert(_ as RinhaValue<"2 >= 2">, _ as true);
assert(_ as RinhaValue<"1 >= 2">, _ as false);
assert(_ as RinhaValue<"1 > 2 != 2 > 1">, _ as true);
assert(_ as RinhaValue<"1 > 2 == 3 > 4">, _ as true);
assert(_ as RinhaValue<"true && true || true && false">, _ as true);
assert(_ as RinhaValue<"false && true || true && false">, _ as false);

// Vars:

assert(_ as RinhaValue<"let a = 1; let b = 2; a + b">, _ as 3);
assert(_ as RinhaValue<"let a = 1; let a = 2; a">, _ as 2);

// Functions:

assert(_ as RinhaStdOut<"print(fn () => { 1 })">, _ as "<#closure>\n");
assert(_ as RinhaValue<"let f = fn () => { 1 }; f()">, _ as 1);
assert(_ as RinhaValue<"let a = 1; let f = fn () => { a }; let a = 2; f()">, _ as 1);
assert(_ as RinhaValue<"let a = 1; let f = fn (a) => { a }; let a = 2; f(3)">, _ as 3);
assert(_ as RinhaValue<"let f = fn (n) => { if (n > 0) { f(n-1) } else { n } }; f(10)">, _ as 0);
assert(_ as RinhaValue<"(fn (sum) => { print(sum(10, 12)) })(fn (a, b) => { a + b })">, _ as 22);
assert(_ as RinhaValue<"let execute = fn (func, n) => { func(n) }; let square = fn (n) => { n * n }; execute(square, 4)">, _ as 16);

// Semicolon:

assert(_ as RinhaValue<"1;">, _ as 1);
assert(_ as RinhaValue<"1;;;;">, _ as 1);
assert(_ as RinhaValue<"let f = fn () => { 1; }; f();">, _ as 1);
assert(_ as RinhaValue<"let f = fn (x) => { if (x) { 1; } else { 2; } }; f(false);">, _ as 2);
