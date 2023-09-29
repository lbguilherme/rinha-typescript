import { _, assert } from "spec.ts";
import { ExecuteRinha } from "./executor";
import { ParseRinha } from "./parser";

type Rinha<Source extends string> = ParseRinha<Source> extends infer Ast ? Ast extends { expression: any } ? ExecuteRinha<Ast> : Ast : never;
type RinhaValue<Source extends string> = Rinha<Source> extends infer Result ? Result extends { value: infer Value } ? Value : Result : never;
type RinhaPrint<Source extends string> = Rinha<Source> extends infer Result ? Result extends { stdout: infer StdOut } ? StdOut : Result : never;

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
assert(_ as RinhaPrint<"print(10)">, _ as "10\n");
assert(_ as RinhaPrint<"print(-14)">, _ as "-14\n");
assert(_ as RinhaPrint<"print(1180591620717411303424)">, _ as "1180591620717411303424\n");
assert(_ as RinhaValue<"4 % 2">, _ as 0);
assert(_ as RinhaValue<"5 % 2">, _ as 1);
assert(_ as RinhaValue<"6 % 2">, _ as 0);
assert(_ as RinhaValue<"3 / 2">, _ as 1);
assert(_ as RinhaValue<"30 / 2">, _ as 15);

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

// String:

assert(_ as RinhaValue<`"hello"`>, _ as "hello");
assert(_ as RinhaValue<`"a = " + 2`>, _ as "a = 2");
assert(_ as RinhaValue<`10 + "a"`>, _ as "10a");
assert(_ as RinhaValue<`"a" + "b"`>, _ as "ab");
assert(_ as RinhaValue<`"\\\\"`>, _ as "\\");
assert(_ as RinhaValue<`"\\""`>, _ as '"');
assert(_ as RinhaValue<`"\\t"`>, _ as "\t");
assert(_ as RinhaValue<`"\\n"`>, _ as "\n");
assert(_ as RinhaValue<`"\\r"`>, _ as "\r");
assert(_ as RinhaValue<`"\\b"`>, _ as "\b");
assert(_ as RinhaValue<`"\\f"`>, _ as "\f");

// Print:

assert(_ as RinhaValue<`print(1+1)`>, _ as 2);
assert(_ as RinhaPrint<`let _ = print(1); print(2)`>, _ as "1\n2\n");
assert(_ as RinhaPrint<"print(fn () => { 1 })">, _ as "<#closure>\n");
assert(_ as RinhaPrint<"print(true)">, _ as "true\n");
assert(_ as RinhaPrint<"print(false)">, _ as "false\n");
assert(_ as RinhaPrint<`print("hello")`>, _ as "hello\n");
assert(_ as RinhaPrint<`print("a = " + 2)`>, _ as "a = 2\n");

// Functions:

assert(_ as RinhaValue<"let f = fn () => { 1 }; f()">, _ as 1);
assert(_ as RinhaValue<"let a = 1; let f = fn () => { a }; let a = 2; f()">, _ as 1);
assert(_ as RinhaValue<"let a = 1; let f = fn (a) => { a }; let a = 2; f(3)">, _ as 3);
assert(_ as RinhaValue<"let f = fn (n) => { if (n > 0) { f(n-1) } else { n } }; f(10)">, _ as 0);
assert(_ as RinhaValue<"(fn (sum) => { print(sum(10, 12)) })(fn (a, b) => { a + b })">, _ as 22);
assert(_ as RinhaValue<"let execute = fn (func, n) => { func(n) }; let square = fn (n) => { n * n }; execute(square, 4)">, _ as 16);
assert(_ as RinhaValue<"let fib = fn (n, a, b) => { if (n == 0) { a } else { fib(n - 1, b, a + b) } }; fib(100, 0, 1)">, _ as 354224848179261915075n);
assert(_ as RinhaPrint<"let fib = fn (n, a, b) => { let _ = print(a); if (n == 0) { a } else { fib(n - 1, b, a + b) } }; fib(10, 0, 1)">, _ as "0\n1\n1\n2\n3\n5\n8\n13\n21\n34\n55\n");
assert(_ as RinhaValue<"let f = fn () => { let x = 1; fn () => { x } }; let g = f(); g()">, _ as 1);
assert(_ as RinhaValue<"let f = fn () => { fn () => { 2 } }; f()()">, _ as 2);
assert(_ as RinhaValue<"fn () => { fn () => { 3 } }()()">, _ as 3);
assert(_ as RinhaValue<`let sum = fn (n) => { if (n == 0) { 0 } else { n + sum(n - 1) } }; (sum(10), sum(100))`>, _ as [55, 5050]);
assert(_ as RinhaPrint<`let sum = fn (n) => { let _ = print(n); if (n == 0) { 0 } else { n + sum(n - 1) } }; sum(10)`>, _ as "10\n9\n8\n7\n6\n5\n4\n3\n2\n1\n0\n");

// Semicolon:

assert(_ as RinhaValue<"1;">, _ as 1);
assert(_ as RinhaValue<"1;;;;">, _ as 1);
assert(_ as RinhaValue<"let f = fn () => { 1; }; f();">, _ as 1);
assert(_ as RinhaValue<"let f = fn (x) => { if (x) { 1; } else { 2; } }; f(false);">, _ as 2);

// Tuples:

assert(_ as RinhaValue<"(1, 2)">, _ as [1, 2]);
assert(_ as RinhaPrint<"print((1,2))">, _ as "(1, 2)\n");
assert(_ as RinhaValue<"first((1, 2))">, _ as 1);
assert(_ as RinhaValue<"second((1, 2))">, _ as 2);
assert(_ as RinhaValue<`let reduce = fn (t, f) => { if (second(t) == 0) { first(t) } else { f(first(t), reduce(second(t), f)) } }; reduce((1, (2, (3, (4, 0)))), fn (a, b) => { a + b})`>, _ as 10);

// If:

assert(_ as RinhaValue<"if (true) { 1 } else { 2 }">, _ as 1);
assert(_ as RinhaValue<"if (false) { 1 } else { 2 }">, _ as 2);

// Operations:

assert(_ as RinhaValue<"123 + 456">, _ as 579);
assert(_ as RinhaValue<"123 - 456">, _ as -333);
assert(_ as RinhaValue<"3 / 2">, _ as 1);
assert(_ as RinhaValue<"11 * 2">, _ as 22);
assert(_ as RinhaValue<"4 % 2">, _ as 0);

assert(_ as RinhaValue<"123456789 == 123456789">, _ as true);
assert(_ as RinhaValue<"123456789 == 45679">, _ as false);
assert(_ as RinhaValue<"123456789 != 45679">, _ as true);
assert(_ as RinhaValue<"123456789 != 123456789">, _ as false);

assert(_ as RinhaValue<"123 < 456">, _ as true);
assert(_ as RinhaValue<"456 < 123">, _ as false);
assert(_ as RinhaValue<"456 <= 456">, _ as true);
assert(_ as RinhaValue<"124 <= 123">, _ as false);
assert(_ as RinhaValue<"456 > 123">, _ as true);
assert(_ as RinhaValue<"123 > 456">, _ as false);
assert(_ as RinhaValue<"123 >= 124">, _ as false);
assert(_ as RinhaValue<"123 >= 124">, _ as false);

assert(_ as RinhaValue<`123 + "def"`>, _ as "123def");
assert(_ as RinhaValue<`"abc" + 456`>, _ as "abc456");
assert(_ as RinhaValue<`"abc" + "def"`>, _ as "abcdef");
assert(_ as RinhaValue<`""`>, _ as "");

assert(_ as RinhaValue<`"foobarbaz" == "foobarbaz"`>, _ as true);
assert(_ as RinhaValue<`"foobarbaz" == "foobarbax"`>, _ as false);

assert(_ as RinhaValue<`(if (true) {123} else {""}) + 456`>, _ as 579);
assert(_ as RinhaValue<`123 +  (if (true) { 456 } else {""})`>, _ as 579);
assert(_ as RinhaValue<`(if (true) {123} else {""}) + (if (true) { 456 } else {""})`>, _ as 579);

assert(_ as RinhaValue<`(if (true) {123} else {""}) - 456`>, _ as -333);
assert(_ as RinhaValue<`123 - (if (true) { 456 } else {""})`>, _ as -333);
assert(_ as RinhaValue<`(if (true) {123} else {""}) - (if (true) { 456 } else {""})`>, _ as -333);

assert(_ as RinhaValue<`(if (true) { 123 } else {false}) + "def"`>, _ as "123def");
assert(_ as RinhaValue<`(123 + (if (true) {"def"} else {false}))`>, _ as "123def");
assert(_ as RinhaValue<`(if (true) { 123 } else {false}) + (if (true) {"def"} else {false})`>, _ as "123def");

assert(_ as RinhaValue<`(if (true) {"abc"} else {false}) + 456`>, _ as "abc456");
assert(_ as RinhaValue<`"abc" + (if (true) { 456 } else {false})`>, _ as "abc456");
assert(_ as RinhaValue<`(if (true) {"abc"} else {false}) + (if (true) { 456 } else {false})`>, _ as "abc456");

assert(_ as RinhaValue<`(if (true) {"abc"} else {false}) + "def"`>, _ as "abcdef");
assert(_ as RinhaValue<`"abc" + (if (true) {"def"} else {false})`>, _ as "abcdef");
assert(_ as RinhaValue<`(if (true) {"abc"} else {false}) + (if (true) {"def"} else {false})`>, _ as "abcdef");

assert(_ as RinhaValue<`(if (true) {"abc"} else {false}) + "def"`>, _ as "abcdef");
assert(_ as RinhaValue<`"abc" + (if (true) {"def"} else {false})`>, _ as "abcdef");
assert(_ as RinhaValue<`(if (true) {"abc"} else {false}) + (if (true) {"def"} else {false})`>, _ as "abcdef");

assert(_ as RinhaValue<`(if (true) {""} else {false})`>, _ as "");

assert(_ as RinhaValue<`first((312,123))`>, _ as 312);
assert(_ as RinhaValue<`second((1,2123))`>, _ as 2123);
