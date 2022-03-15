export const ToChars = (str: string): string[] => {
  return Array.from(str)
}

export interface Atom<T> {
  value: T
}

type AUT = Atom<number> | Atom<string> | Atom<boolean>

export const ParseAtom = (str: string): AUT => {
  str = str.trim()
  if (str === '') throw Error('Invalid symbol')
  const result = Number(str)
  if (isNaN(result)) {
    if (str === 'true') {
      return <AUT>{ value: true }
    } else if (str === 'false') {
      return <AUT>{ value: false }
    }
    return <AUT>{ value: str }
  } else {
    return <AUT>{ value: result }
  }
}

export interface List {
  items: (AUT | List)[]
}

const listOpenDelimeter = '('
const listCloseDelimeter = ')'
const listElementDelimeter = [' ', '\n', '\r', '\t']

const ParseActualList = (
  elements: string[],
  iterator: number,
): [List, number] => {
  const result = <List>{ items: [] }
  let atomStart = -1

  const addAtom = () => {
    if (atomStart != -1) {
      const atom = elements.slice(atomStart, iterator)
      result.items.push(ParseAtom(atom.join('')))
    }
  }

  while (iterator < elements.length) {
    if (elements[iterator] === listOpenDelimeter) {
      const [l, m] = ParseActualList(elements, iterator + 1)
      result.items.push(l)
      iterator = m
      continue
    }
    if (elements[iterator] === listCloseDelimeter) {
      addAtom()
      return [result, iterator + 1]
    }
    if (listElementDelimeter.includes(elements[iterator])) {
      addAtom()
      atomStart = -1
    } else {
      if (atomStart == -1) {
        atomStart = iterator
      }
    }
    iterator++
  }
  return [result, iterator]
}

export const ParseList = (str: string): List => {
  if (str.length === 0) throw Error('Expected a valid string')
  str = str.trim()
  if (str[0] !== listOpenDelimeter) throw Error('Starting ( not found')
  const elements = ToChars(str)

  const [l, m] = ParseActualList(elements, 0)
  return <List>l.items[0]
}

export const isAtom = (o: AUT | List): o is AUT => {
  return (o as AUT).value != undefined
}

export const isList = (o: AUT | List): o is List => {
  return (o as List).items != undefined
}

// first value of the list must be an atom
export const first = (list: List): AUT => {
  if (list.items.length === 0) throw Error('List is empty')
  if (isAtom(list.items[0])) {
    return list.items[0]
  }
  throw Error('List must start with an atom')
}

// first value of the list must be an atom
export const rest = (list: List): List => {
  const temp = <List>{ items: [] }
  if (list.items.length === 0) return temp
  temp.items = list.items.slice(1)
  return temp
}

// --------------------------------------------- Arithematic Operators --------------------

type basicArithmeticOps = (a: Atom<number>, b: Atom<number>) => Atom<number>
export interface FunMap {
  [key: string]: basicArithmeticOps
}

// f.value contains the symbol
const performBasicArithmeticOps = (remaining: List, first: Atom<string>) => {
  const evaluated = remaining.items.map((value) => {
    return Eval(value)
  })
  if (evaluated.length === 0)
    throw Error('Not enough arguments to the operator ' + first.value)
  let a = <Atom<number>>evaluated[0]

  const fun = _basicArithmeticOps[first.value]
  for (let i = 1; i < evaluated.length; i++) {
    a = fun(a, <Atom<number>>evaluated[i])
  }
  return a
}

const _add = (a: Atom<number>, b: Atom<number>): Atom<number> => {
  return <Atom<number>>{ value: a.value + b.value }
}

const _sub = (a: Atom<number>, b: Atom<number>): Atom<number> => {
  return <Atom<number>>{ value: a.value - b.value }
}
const _mul = (a: Atom<number>, b: Atom<number>): Atom<number> => {
  return <Atom<number>>{ value: a.value * b.value }
}
const _div = (a: Atom<number>, b: Atom<number>): Atom<number> => {
  return <Atom<number>>{ value: a.value / b.value }
}

const _basicArithmeticOps: FunMap = {
  '+': _add,
  '-': _sub,
  '*': _mul,
  '/': _div,
}

// --------------------------------------------- Comparision Operators --------------------

type basicComparisionOps = (a: AUT, b: AUT) => Atom<boolean>
export interface FunMap2 {
  [key: string]: basicComparisionOps
}

function performBasicComparisonOps(r: List, f: Atom<string>): Atom<boolean> {
  const fun = _basicComparisionOps[f.value]
  if (r.items.length != 2)
    throw new Error('Comparison operation ' + f.value + ' needs 2 arguments')
  const [a, b] = r.items
  return fun(Eval(a), Eval(b))
}

const _equal = (a: AUT, b: AUT): Atom<boolean> => {
  return <Atom<boolean>>{ value: a.value === b.value }
}

const _notEqual = (a: AUT, b: AUT): Atom<boolean> => {
  return <Atom<boolean>>{ value: a.value != b.value }
}

const _gt = (a: AUT, b: AUT): Atom<boolean> => {
  return <Atom<boolean>>{ value: a.value > b.value }
}

const _lt = (a: AUT, b: AUT): Atom<boolean> => {
  return <Atom<boolean>>{ value: a.value < b.value }
}

const _and = (a: AUT, b: AUT): Atom<boolean> => {
  return <Atom<boolean>>{ value: a.value && b.value }
}

const _or = (a: AUT, b: AUT): Atom<boolean> => {
  return <Atom<boolean>>{ value: a.value || b.value }
}

const _basicComparisionOps: FunMap2 = {
  '==': _equal,
  '!=': _notEqual,
  '>': _gt,
  '<': _lt,
  '&&': _and,
  '||': _or,
}

// ---------------------------------------------------------------- Logical Comparison Operators --------------------

const performLogicalComparisionOps = (
  remaining: List,
  first: Atom<string>,
): AUT => {
  const [test, ifTrue, ifFalse] = remaining.items
  return Eval(test).value ? Eval(ifTrue) : Eval(ifFalse)
}

// ---------------------------------------------------------------- Function Definitions ----------------------------------------------------------------

//-------------------------------------------------------------------
type TUserFunc = (args: List) => AUT
interface Context {
  [key: string]: AUT | List | TUserFunc
}
function performFunctionDefinitionOps(
  r: List,
  f: Atom<string>,
  ctx: Context,
): AUT {
  if (r.items.length < 3) throw Error('Malformed function definition')
  const fname = <Atom<string>>r.items[0]
  // check if the function name already exists in the context
  if (fname.value in ctx) {
    throw Error('Function `' + fname.value + '` already defined')
  } else {
    const fparams = <List>r.items[1]
    const fbodies = r.items.slice(2)
    ctx[fname.value] = (args) => {
      // body of the function
      // bind args to params
      if (args.items.length != fparams.items.length)
        throw Error(
          'Expected ' +
            fparams.items.length +
            ' number of argumets to the function ' +
            fname,
        )

      for (let i = 0; i < fparams.items.length; i++) {
        const p = <Atom<string>>fparams.items[i]
        ctx[p.value] = args.items[i]
        console.log(`setting ${p.value} = ${args.items[i]}`)
      }

      // defn <name> <params> <body 1> <body 2> .. <body n>
      // evaluate all bodies, and return the result of the last one
      const h = fbodies.map((k) => Eval(k, ctx))
      return h[h.length - 1]
    }
  }
  // definition succeeded
  return <Atom<boolean>>{ value: true }
}

function performFunctionExecOps(r: List, f: Atom<string>, ctx: Context): AUT {
  const fun = <TUserFunc>ctx[f.value]
  const args = r.items.slice(0)
  const a = args.map((k) => Eval(k, ctx))
  return fun(<List>{ items: a })
}

// ------------------------------------------------------------------- Evaluaters

export const Eval = (exp: AUT | List, ctx: Context = {}): AUT => {
  if (isAtom(exp)) {
    if (typeof exp.value === 'string') {
      if (exp.value.startsWith("'")) return exp
      if (exp.value in ctx) {
        // resolve symbol to a value
        return <AUT>ctx[exp.value]
      }
    }
    return exp
  } else if (isList(exp)) {
    const start = <Atom<string>>first(exp)
    const remaining = rest(exp)
    if (start.value in _basicArithmeticOps) {
      return performBasicArithmeticOps(remaining, start)
    } else if (start.value in _basicComparisionOps) {
      return performBasicComparisonOps(remaining, start)
    } else if (start.value === 'if') {
      return performLogicalComparisionOps(remaining, start)
    } else if (start.value === 'defn') {
      return performFunctionDefinitionOps(remaining, start, ctx)
    } else if (start.value in ctx) {
      return performFunctionExecOps(remaining, start, ctx)
    }
    return start
  }
  throw Error('Unknown evaluation error ' + exp)
}

export function Run(exp: AUT | List): AUT {
  const ctx: Context = {}
  const retval = Eval(exp, ctx)
  if ('main' in ctx) {
    const fun = <TUserFunc>ctx['main']
    const args = <List>{ items: [] }
    return fun(args)
  }
  return retval
}
