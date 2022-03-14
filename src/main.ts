export const ToChars = (str: string): string[] => {
  return Array.from(str)
}

export interface Atom<T> {
  value: T
}

type AUT = Atom<number> | Atom<string> | Atom<boolean>

// TODO: add support for other symbols
export const ParseAtom = (str: String): AUT => {
  str = str.trim()
  if (str === '') throw Error('Expected a valid String')
  const result = Number(str)
  return isNaN(result) ? <AUT>{ value: str } : <AUT>{ value: result }
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
  if (str.length === 0) throw Error('Expected a valid String')
  if (str[0] !== listOpenDelimeter) throw Error('List should start with (')
  if (str[str.length - 1] !== listCloseDelimeter)
    throw Error('List should end with )')

  const elements = ToChars(str)

  const [l, m] = ParseActualList(elements, 0)
  return <List>{ items: [] }
}

export const isAtom = (o: AUT | List): o is AUT => {
  return (o as AUT).value != undefined
}

export const isList = (o: AUT | List): o is List => {
  return (o as List).items != undefined
}

// first value of the list must be an atom
export const first = (list: List): AUT => {
  if (list.items.length === 0) throw Error('list is empty')
  if (isAtom(list.items[0])) {
    return list.items[0]
  }
  throw Error('List must start with an atom')
}

// first value of the list must be an atom
export const rest = (list: List): List => {
  let temp = <List>{ items: [] }
  if (list.items.length === 0) return temp
  temp.items = list.items.slice(1)
  return temp
}

// basic arthematic operations

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
