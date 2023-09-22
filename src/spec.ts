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

assert(_ as RinhaValue<"1+">, _ as { $error: "Expected end of string, but found '+'" });

// Vars:

assert(_ as RinhaValue<"let a = 1; let b = 2; a + b">, _ as 3);
assert(_ as RinhaValue<"let a = 1; let a = 2; a">, _ as 2);

// Functions:

assert(_ as RinhaValue<"let f = fn () => { 1 }; f()">, _ as 1);
assert(_ as RinhaValue<"let a = 1; let f = fn () => { a }; let a = 2; f()">, _ as 1);
assert(_ as RinhaValue<"let a = 1; let f = fn (a) => { a }; let a = 2; f(3)">, _ as 3);
