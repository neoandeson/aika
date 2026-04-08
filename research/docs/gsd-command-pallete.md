# GSD Command Palette

## Core Workflow

| Command | Description |
|---------|-------------|
| `/gsd:new-project` | Initialize new project with research, requirements, and roadmap |
| `/gsd:plan-phase <N>` | Create detailed execution plan (PLAN.md) for a phase |
| `/gsd:execute-phase <N>` | Execute all plans in a phase with wave-based parallelization |
| `/gsd:progress` | Check project status and route to next action |

## Project Initialization

| Command | Description |
|---------|-------------|
| `/gsd:new-project` | Full project setup: questioning, research, requirements, roadmap |
| `/gsd:map-codebase` | Analyze existing codebase for brownfield projects |

## Phase Planning

| Command | Description |
|---------|-------------|
| `/gsd:discuss-phase <N>` | Gather phase context through adaptive questioning before planning |
| `/gsd:research-phase <N>` | Deep ecosystem research for niche/complex domains |
| `/gsd:list-phase-assumptions <N>` | See Claude's intended approach before planning starts |
| `/gsd:plan-phase <N>` | Create detailed phase plan with verification criteria |

## Execution

| Command | Description |
|---------|-------------|
| `/gsd:execute-phase <N>` | Execute all plans in a phase (wave-based parallel execution) |
| `/gsd:execute-phase <N> --wave <W>` | Execute only a specific wave within a phase |
| `/gsd:autonomous` | Run all remaining phases autonomously (discuss, plan, execute) |

## Quick Tasks

| Command | Description |
|---------|-------------|
| `/gsd:fast [description]` | Trivial inline task -- no subagents, no planning overhead |
| `/gsd:quick` | Small task with GSD guarantees but skip optional agents |
| `/gsd:quick --full` | Quick task with plan-checking and post-execution verification |
| `/gsd:quick --discuss` | Quick task with lightweight discussion first |
| `/gsd:quick --research` | Quick task with focused research before planning |
| `/gsd:do <description>` | Route freeform text to the right GSD command automatically |

## Roadmap Management

| Command | Description |
|---------|-------------|
| `/gsd:add-phase <description>` | Add new phase to end of current milestone |
| `/gsd:insert-phase <after> <desc>` | Insert urgent work as decimal phase (e.g., 7.1) |
| `/gsd:remove-phase <N>` | Remove a future phase and renumber subsequent phases |

## Milestone Management

| Command | Description |
|---------|-------------|
| `/gsd:new-milestone <name>` | Start a new milestone cycle with full setup flow |
| `/gsd:complete-milestone <ver>` | Archive completed milestone and prepare for next |
| `/gsd:audit-milestone [version]` | Audit milestone completion against original intent |
| `/gsd:plan-milestone-gaps` | Create phases to close gaps identified by audit |
| `/gsd:milestone-summary` | Generate comprehensive project summary for onboarding |

## Session Management

| Command | Description |
|---------|-------------|
| `/gsd:progress` | Visual progress bar, recent work summary, next actions |
| `/gsd:resume-work` | Resume previous session with full context restoration |
| `/gsd:pause-work` | Create context handoff when pausing mid-phase |

## Notes & Todos

| Command | Description |
|---------|-------------|
| `/gsd:note <text>` | Zero-friction idea capture, instant save |
| `/gsd:note list` | List all saved notes |
| `/gsd:note promote <N>` | Promote a note into a structured todo |
| `/gsd:add-todo [description]` | Capture idea or task as todo from conversation |
| `/gsd:check-todos [area]` | List pending todos and select one to work on |
| `/gsd:add-backlog <description>` | Add an idea to the backlog parking lot |
| `/gsd:review-backlog` | Review and promote backlog items to active milestone |
| `/gsd:plant-seed [idea]` | Capture forward-looking idea with trigger conditions |

## Testing & Verification

| Command | Description |
|---------|-------------|
| `/gsd:verify-work [phase]` | Validate features through conversational UAT |
| `/gsd:audit-uat` | Cross-phase audit of all outstanding UAT items |
| `/gsd:validate-phase <N>` | Retroactively audit and fill validation gaps |
| `/gsd:add-tests <N>` | Generate tests for a completed phase |

## Shipping & Review

| Command | Description |
|---------|-------------|
| `/gsd:ship [phase]` | Create PR, run review, prepare for merge |
| `/gsd:ship <N> --draft` | Create draft PR from completed phase |
| `/gsd:review --phase <N> --all` | Cross-AI peer review from external AI CLIs |
| `/gsd:pr-branch [target]` | Clean branch filtering out .planning/ commits |

## Debugging

| Command | Description |
|---------|-------------|
| `/gsd:debug [description]` | Start systematic debugging with persistent state |
| `/gsd:debug` | Resume active debug session after /clear |
| `/gsd:forensics` | Post-mortem investigation for failed GSD workflows |

## Configuration

| Command | Description |
|---------|-------------|
| `/gsd:settings` | Configure workflow toggles and model profile |
| `/gsd:set-profile <profile>` | Switch model profile (quality/balanced/budget/inherit) |
| `/gsd:health` | Diagnose planning directory health and repair issues |

## Workspaces & Threads

| Command | Description |
|---------|-------------|
| `/gsd:new-workspace` | Create isolated workspace with repo copies |
| `/gsd:list-workspaces` | List active GSD workspaces and status |
| `/gsd:remove-workspace` | Remove a workspace and clean up worktrees |
| `/gsd:workstreams` | Manage parallel workstreams |
| `/gsd:thread` | Manage persistent context threads for cross-session work |

## Utility

| Command | Description |
|---------|-------------|
| `/gsd:help` | Show full command reference |
| `/gsd:update` | Update GSD to latest version with changelog |
| `/gsd:cleanup` | Archive phase dirs from completed milestones |
| `/gsd:stats` | Display project statistics and timeline |
| `/gsd:session-report` | Generate session report with token usage and outcomes |
| `/gsd:profile-user` | Generate developer behavioral profile |
| `/gsd:join-discord` | Join the GSD Discord community |

---

# Daily GSD Workflow

## Morning: Start Your Day

```
/gsd:resume-work          # Restore context from last session
/gsd:progress             # See where you are, what's next
/gsd:check-todos          # Review any pending ideas/tasks
```

**Decision point:**
- Have a planned phase ready? -> Go to **Build**
- Need to plan next phase? -> Go to **Plan**
- Hit a bug yesterday? -> Go to **Debug**

## Plan: Prepare the Work

```
/gsd:discuss-phase <N>              # Clarify vision and boundaries
/gsd:plan-phase <N>                 # Create detailed execution plan
/clear                              # Free up context for execution
```

For complex/unfamiliar domains, add research:
```
/gsd:research-phase <N>             # Deep ecosystem research first
/gsd:plan-phase <N>                 # Then plan with research context
```

## Build: Execute the Work

```
/gsd:execute-phase <N>              # Run the phase (parallel waves)
```

During execution, capture stray ideas without breaking flow:
```
/gsd:note "refactor the hook system later"
/gsd:add-todo "add error boundary to dashboard"
```

For small tasks that pop up:
```
/gsd:fast "fix typo in README"      # Trivial, inline
/gsd:quick                          # Small but needs structure
```

## Debug: When Things Break

```
/gsd:debug "form submission fails"  # Start investigation
# ... investigate ...
/clear
/gsd:debug                          # Resume after context reset
```

## Verify: Confirm Quality

```
/gsd:verify-work <N>                # Conversational UAT
/gsd:audit-uat                      # Sweep all outstanding items
```

## Ship: Get It Out

```
/gsd:ship <N>                       # Create PR from phase work
```

## End of Day: Wrap Up

```
/gsd:pause-work                     # Save context for tomorrow
/gsd:session-report                 # Review what you accomplished
```

## Weekly Cadence

| Day | Focus |
|-----|-------|
| **Monday** | `/gsd:progress` -> Plan phases for the week |
| **Tue-Thu** | Build loop: plan -> execute -> verify |
| **Friday** | `/gsd:audit-uat` -> `/gsd:ship` -> `/gsd:check-todos` |

## Milestone Transitions

When all phases are done:
```
/gsd:audit-milestone                # Check completeness
/gsd:plan-milestone-gaps            # Close any gaps
/gsd:complete-milestone <version>   # Archive and tag
/clear
/gsd:new-milestone <name>           # Start next cycle
```

## Tips

- **Use `/clear` between phases** to free context for the next task
- **Capture ideas immediately** with `/gsd:note` -- sort them later
- **One phase at a time** -- don't plan 3 phases ahead, things change
- **Quick over perfect** -- `/gsd:fast` for trivial fixes, don't over-engineer
- **Debug with state** -- `/gsd:debug` survives `/clear`, use it for hard bugs
