'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Eval =
  exports.rest =
  exports.first =
  exports.isList =
  exports.isAtom =
  exports.ParseList =
  exports.ParseAtom =
  exports.ToChars =
    void 0;
const ToChars = (str) => {
  return Array.from(str);
};
exports.ToChars = ToChars;
const ParseAtom = (str) => {
  str = str.trim();
  if (str === '') throw Error('Invalid symbol');
  const result = Number(str);
  if (isNaN(result)) {
    if (str === 'true') {
      return { value: true };
    } else if (str === 'false') {
      return { value: false };
    }
    return { value: str };
  } else {
    return { value: result };
  }
};
exports.ParseAtom = ParseAtom;
const listOpenDelimeter = '(';
const listCloseDelimeter = ')';
const listElementDelimeter = [' ', '\n', '\r', '\t'];
const ParseActualList = (elements, iterator) => {
  const result = { items: [] };
  let atomStart = -1;
  const addAtom = () => {
    if (atomStart != -1) {
      const atom = elements.slice(atomStart, iterator);
      result.items.push((0, exports.ParseAtom)(atom.join('')));
    }
  };
  while (iterator < elements.length) {
    if (elements[iterator] === listOpenDelimeter) {
      const [l, m] = ParseActualList(elements, iterator + 1);
      result.items.push(l);
      iterator = m;
      continue;
    }
    if (elements[iterator] === listCloseDelimeter) {
      addAtom();
      return [result, iterator + 1];
    }
    if (listElementDelimeter.includes(elements[iterator])) {
      addAtom();
      atomStart = -1;
    } else {
      if (atomStart == -1) {
        atomStart = iterator;
      }
    }
    iterator++;
  }
  return [result, iterator];
};
const ParseList = (str) => {
  if (str.length === 0) throw Error('Expected a valid string');
  if (str[0] !== listOpenDelimeter) throw Error('Starting ( not found');
  if (str[str.length - 1] !== listCloseDelimeter)
    throw Error('List should end with )');
  const elements = (0, exports.ToChars)(str);
  const [l, m] = ParseActualList(elements, 0);
  return l.items[0];
};
exports.ParseList = ParseList;
const isAtom = (o) => {
  return o.value != undefined;
};
exports.isAtom = isAtom;
const isList = (o) => {
  return o.items != undefined;
};
exports.isList = isList;
// first value of the list must be an atom
const first = (list) => {
  if (list.items.length === 0) throw Error('List is empty');
  if ((0, exports.isAtom)(list.items[0])) {
    return list.items[0];
  }
  throw Error('List must start with an atom');
};
exports.first = first;
// first value of the list must be an atom
const rest = (list) => {
  let temp = { items: [] };
  if (list.items.length === 0) return temp;
  temp.items = list.items.slice(1);
  return temp;
};
exports.rest = rest;
// f.value contains the symbol
const performBasicArithmeticOps = (remaining, first) => {
  const evaluated = remaining.items.map((value) => {
    return (0, exports.Eval)(value);
  });
  if (evaluated.length === 0)
    throw Error('Not enough arguments to the operator ' + first.value);
  let a = evaluated[0];
  const fun = _basicArithmeticOps[first.value];
  for (let i = 1; i < evaluated.length; i++) {
    a = fun(a, evaluated[i]);
  }
  return a;
};
const _add = (a, b) => {
  return { value: a.value + b.value };
};
const _sub = (a, b) => {
  return { value: a.value - b.value };
};
const _mul = (a, b) => {
  return { value: a.value * b.value };
};
const _div = (a, b) => {
  return { value: a.value / b.value };
};
const _basicArithmeticOps = {
  '+': _add,
  '-': _sub,
  '*': _mul,
  '/': _div,
};
function performBasicComparisonOps(r, f) {
  const fun = _basicComparisionOps[f.value];
  if (r.items.length != 2)
    throw new Error('Comparison operation ' + f.value + ' needs 2 arguments');
  const [a, b] = r.items;
  return fun((0, exports.Eval)(a), (0, exports.Eval)(b));
}
const _equal = (a, b) => {
  return { value: a.value === b.value };
};
const _notEqual = (a, b) => {
  return { value: a.value != b.value };
};
const _gt = (a, b) => {
  return { value: a.value > b.value };
};
const _lt = (a, b) => {
  return { value: a.value < b.value };
};
const _and = (a, b) => {
  return { value: a.value && b.value };
};
const _or = (a, b) => {
  return { value: a.value || b.value };
};
const _basicComparisionOps = {
  '==': _equal,
  '!=': _notEqual,
  '>': _gt,
  '<': _lt,
  '&&': _and,
  '||': _or,
};
// ---------------------------------------------------------------- Logical Comparison Operators --------------------
const performLogicalComparisionOps = (remaining, first) => {
  const [test, ifTrue, ifFalse] = remaining.items;
  return (0, exports.Eval)(test).value
    ? (0, exports.Eval)(ifTrue)
    : (0, exports.Eval)(ifFalse);
};
// ---------------------------------------------------------------- Function Definitions ----------------------------------------------------------------
const performFunctionDefineOps = (remaining, first) => {
  // return <Atom>{ value: true }
};
const Eval = (exp) => {
  if ((0, exports.isAtom)(exp)) {
    if (typeof exp.value === 'string') {
      if (exp.value.startsWith("'")) return exp;
      // if (exp.value in ctx) {
      //   // resolve symbol to a value
      //   return <AUT>ctx[exp.value]
      // }
    }
    return exp;
  } else if ((0, exports.isList)(exp)) {
    const start = (0, exports.first)(exp);
    const remaining = (0, exports.rest)(exp);
    if (start.value in _basicArithmeticOps) {
      return performBasicArithmeticOps(remaining, start);
    } else if (start.value in _basicComparisionOps) {
      return performBasicComparisonOps(remaining, start);
    } else if (start.value === 'if') {
      return performLogicalComparisionOps(remaining, start);
    } else if (start.value === 'defn') {
      performFunctionDefineOps(remaining, start);
    }
    return start;
  }
  throw Error('Unknown evaluation error ' + exp);
};
exports.Eval = Eval;
