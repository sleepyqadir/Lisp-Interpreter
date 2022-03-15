#!/usr/bin/env node

import { Command } from 'commander'
import { Eval, ParseList } from './interpreter/interpreter'
import chalk from 'chalk'

async function run() {
  const program = new Command()

  program
    .argument('<inst>', 'lisp-interpreter will operate this instruction')
    // .option(
    //   '-i, --iteration <type>',
    //   'How many times Lighthouse should run the analysis per URL',
    //   '5',
    // )
    .parse()

  const [inst] = program.args
  //   const options = program.opts()
  const t = ParseList(inst)
  const actual = Eval(t)
  console.log(chalk.yellowBright(`instruction: ${inst}`))
  console.log(chalk.green(`parsed instruction ${actual.value}`))
}

run()
