#!/usr/bin/env node
import { Command } from "commander";

const program = new Command();

program
  .name("aika")
  .description("AI Kit Awareness — One project. Many kits. Zero conflicts.")
  .version("0.1.0");

program.parse();
