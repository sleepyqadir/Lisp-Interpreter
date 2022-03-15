#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const interpreter_1 = require("./interpreter/interpreter");
const chalk_1 = __importDefault(require("chalk"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const program = new commander_1.Command();
        program
            .argument('<inst>', 'lisp-interpreter will operate this instruction')
            // .option(
            //   '-i, --iteration <type>',
            //   'How many times Lighthouse should run the analysis per URL',
            //   '5',
            // )
            .parse();
        const [inst] = program.args;
        //   const options = program.opts()
        const t = (0, interpreter_1.ParseList)(inst);
        const actual = (0, interpreter_1.Eval)(t);
        console.log(chalk_1.default.yellowBright(`instruction: ${inst}`));
        console.log(chalk_1.default.green(`parsed instruction ${actual.value}`));
    });
}
run();
