/* Update this file as release materials become available. No build step is needed. */
window.HIDE_CONTENT = {
  project: {
    paperUrl: "https://arxiv.org/abs/2609.38886",
    paperPdfUrl: "https://arxiv.org/pdf/2609.38886",
    huggingFacePaperUrl: "https://huggingface.co/papers/2609.38886",
    siteUrl: "https://nanamma.github.io/HIDE-SEEK/", // Public GitHub Pages URL, including the repository path.
    publicationDate: "2026-09-30",
    repositoryUrl: "https://github.com/nanamma/HIDE-SEEK",
    datasetUrl: "",
    authors: [{"name": "Yansong Shi"}, {"name": "Jiange Yang"}, {"name": "Xijie Yang"}, {"name": "Shaowei Zhang"}, {"name": "Yuhan Zhu"}, {"name": "Tao Lu"}, {"name": "Limin Wang"}],
    citationIsTemplate: false,
    citation: `@misc{shi2026hide,
  title = {Benchmarking and Enhancing Skill-Level Memory for Partially Observable Robotic Manipulation},
  author = {Yansong Shi and Jiange Yang and Xijie Yang and Shaowei Zhang and Yuhan Zhu and Tao Lu and Limin Wang},
  year = {2026},
  eprint = {2609.38886},
  archivePrefix = {arXiv},
  primaryClass = {cs.RO},
  url = {https://arxiv.org/abs/2609.38886}
}`,
  },
  categories: {
    repetition: { name: "Repetition counting", short: "Repetition", symbol: "↻", remember: "Remember how many times." },
    history: { name: "Historical-state recall", short: "Historical recall", symbol: "◎", remember: "Remember what happened before." },
    progress: { name: "Execution-progress tracking", short: "Progress", symbol: "☷", remember: "Remember what is already done." },
  },
  // Source: overleaf/sec/appendix.tex, first table (tab:task_stats).
  // Frames/keyframes are per-task means; variations are counts, not sample weights.
  benchmarkStatistics: [
    { id: "push_button_times", frames: 144.3, keyframes: 7.8, variations: 50, languageTemplate: "push the [color] button [N] times", variationType: "repetition count × button color" },
    { id: "stack_blocks", frames: 372.8, keyframes: 16.1, variations: 60, languageTemplate: "stack [N] [color] blocks", variationType: "stack size × color" },
    { id: "change_channel_times", frames: 244.5, keyframes: 12.2, variations: 6, languageTemplate: "turn the channel [direction] [N] times", variationType: "direction × repetition count" },
    { id: "stack_cups_new", frames: 208.8, keyframes: 8.4, variations: 40, languageTemplate: "stack [N] cup(s) on top of the [color] cup", variationType: "base color × cup count" },
    { id: "stack_blocks_new", frames: 283.5, keyframes: 11.8, variations: 60, languageTemplate: "put [N] [color] blocks into the rectangular container", variationType: "placement count × color" },
    { id: "weighing_on_off", frames: 199.0, keyframes: 11.0, variations: 2, languageTemplate: "weigh the pepper and put it in another container", variationType: "starting container" },
    { id: "pour_put_back", frames: 330.0, keyframes: 7.5, variations: 40, languageTemplate: "pour liquid from the [color] cup to the [color] cup, then place it on the other coaster", variationType: "coaster side × cup-color pair" },
    { id: "wipe_desk_rubbish", frames: 272.9, keyframes: 9.0, variations: 1, languageTemplate: "wipe dirt off the desk", variationType: "randomized layout" },
    { id: "light_bulb_in_out", frames: 335.9, keyframes: 10.8, variations: 20, languageTemplate: "screw in the light bulb and move it to the other holder", variationType: "holder color (implicit)" },
    { id: "reopen_drawer", frames: 320.2, keyframes: 10.0, variations: 3, languageTemplate: "close the opened drawer, push the button, and open the previous drawer again", variationType: "drawer level (bottom/middle/top)" },
    { id: "search_drawer", frames: 393.8, keyframes: 15.7, variations: 3, languageTemplate: "take item out of the drawer", variationType: "hidden-item drawer level" },
    { id: "search_boxes", frames: 629.1, keyframes: 19.0, variations: 2, languageTemplate: "take shoes out of box", variationType: "search path / holder config" },
    { id: "search_cup_from_cabinet", frames: 245.5, keyframes: 9.9, variations: 2, languageTemplate: "take out a cup from the cabinet", variationType: "cabinet side" },
    { id: "lift_and_check", frames: 277.3, keyframes: 14.3, variations: 80, languageTemplate: "lift blocks one by one to find the white chip underneath and remove it", variationType: "block color × chip position" },
    { id: "swap_square_pegs", frames: 321.3, keyframes: 18.0, variations: 6, languageTemplate: "swap the positions of the two rings", variationType: "peg/ring permutation" },
  ],
  // Source: overleaf/sec/appendix.tex, complete HIDEtask specifications.
  taskDetails: {
    push_button_times: {
      description: "The robot is instructed to identify the target colored button and press it the requested number of times. Depending on the variation, the button must be pressed once, twice, three times, four times, or five times.",
      successMetric: "The task is considered successful once the target button has been pressed exactly the requested number of times and the robot arm has withdrawn upward.",
      objects: "Three colored push buttons and their button mechanisms.",
      keyframeCounts: "4, 6, 8, 10, or 12",
      instructionPattern: "Push the [color] button [count].",
    },
    stack_blocks: {
      description: "The robot is instructed to identify blocks of the specified color and stack the requested number of them vertically. The requested stack contains two, three, or four blocks.",
      successMetric: "The task is considered successful once the requested number of target blocks is detected in the stacking region and the robot is no longer holding an object.",
      objects: "Four target blocks, four distractor blocks, and a stacking region.",
      keyframeCounts: "11, 17, 22, 23, or 24",
      instructionPattern: "Stack [2–4] [color] blocks.",
    },
    change_channel_times: {
      description: "The robot is instructed to pick up the television remote, point it toward the television, and press either the plus or minus channel button the requested number of times.",
      successMetric: "The task is considered successful once the correct channel button has been pressed exactly one, two, or three times, the remote reaches the required final configuration, and the robot arm has withdrawn upward.",
      objects: "A television remote, plus and minus buttons, and a television-facing target region.",
      keyframeCounts: "10, 12, or 14",
      instructionPattern: "Turn the channel [up or minus] [once, twice, or three times].",
    },
    stack_cups_new: {
      description: "The robot is instructed to keep the specified colored cup as the base and place either one or two of the remaining cups on top of it.",
      successMetric: "The task is considered successful once the requested cup or cups are detected in the stack, the gripper is empty, and the robot arm has withdrawn upward.",
      objects: "Three colored cups and a cup-stacking success region.",
      keyframeCounts: "6 or 11",
      instructionPattern: "Stack [one or two] cup(s) on top of the [color] cup.",
    },
    stack_blocks_new: {
      description: "The robot is instructed to identify blocks of the specified color and place the requested number of them into the open rectangular container at the center of the workspace.",
      successMetric: "The task is considered successful once the requested number of target blocks is detected inside the container, the gripper is empty, and the robot arm has withdrawn upward.",
      objects: "Four target blocks, four distractor blocks, and a central open-top container.",
      keyframeCounts: "6, 11, 16, or 17",
      instructionPattern: "Put [1–3] [color] blocks into the rectangular container in the center.",
    },
    weighing_on_off: {
      description: "The robot is instructed to pick up the pepper from one container, place it on the scale long enough to obtain a weight reading, and then move it into the other container.",
      successMetric: "The task is considered successful once the scale has registered the pepper while the gripper is released and the pepper is subsequently detected in the destination container.",
      objects: "A pepper, a weighing scale, and two containers.",
      keyframeCounts: "11",
      instructionPattern: "Weigh the pepper and put it in another container.",
    },
    pour_put_back: {
      description: "The robot is instructed to pick up the source cup, pour its liquid into the target cup, and then place the source cup on the other coaster.",
      successMetric: "The task is considered successful once all liquid particles are detected in the target cup and the source cup is detected on the opposite coaster.",
      objects: "A source cup, a target cup, liquid particles, and two coasters.",
      keyframeCounts: "6, 7, or 8",
      instructionPattern: "Pour liquid from the [source color] cup to the [target color] cup, then place the source cup on the other coaster.",
    },
    wipe_desk_rubbish: {
      description: "The robot is instructed to dispose of the rubbish in the bin and then use the sponge to wipe all visible dirt from the desk.",
      successMetric: "The task is considered successful once the rubbish is detected in the bin and all generated dirt spots have been removed from the desk.",
      objects: "A piece of rubbish, a rubbish bin, a sponge, and multiple dirt spots.",
      keyframeCounts: "8 or 9",
      instructionPattern: "Wipe dirt off the desk.",
    },
    light_bulb_in_out: {
      description: "The robot is instructed to pick up the light bulb from its initial holder, screw it into the lamp until it lights, remove it, and place it into the other holder.",
      successMetric: "The task is considered successful once the bulb has been detected in the lamp, has lit up, is subsequently detected in the destination holder, and has been released by the gripper.",
      objects: "A light bulb, a lamp socket, and two bulb holders.",
      keyframeCounts: "10 or 11",
      instructionPattern: "Screw in the light bulb and move it to the other holder.",
    },
    reopen_drawer: {
      description: "The robot is instructed to remember the drawer slot that was initially open, close it, press the button on the table, and then find and reopen the previously opened drawer.",
      successMetric: "The task is considered successful once the initially opened drawer has been closed, the button has been pressed, and the same drawer has been reopened.",
      objects: "A three-level drawer cabinet and a push button.",
      keyframeCounts: "10",
      instructionPattern: "Close the drawer, then reopen the previously opened drawer while pushing the button in between.",
    },
    search_drawer: {
      description: "The robot is instructed to search the drawers, locate the hidden item, remove it from the correct drawer, and place it in the target region.",
      successMetric: "The task is considered successful once the hidden item is detected in the designated success region outside the drawer.",
      objects: "A three-level drawer cabinet, a hidden item, and a success region.",
      keyframeCounts: "9, 16, or 23",
      instructionPattern: "Take the item out of the drawer.",
    },
    search_boxes: {
      description: "The robot is instructed to open the shoe box, search for both shoes, remove them, and place them on the table.",
      successMetric: "The task is considered successful once both shoes are detected outside the box in the target region and the robot is no longer holding either shoe.",
      objects: "A shoe box and lid, two shoes, and a target region on the table.",
      keyframeCounts: "15, 16, 23, or 24",
      instructionPattern: "Take the shoes out of the box.",
    },
    search_cup_from_cabinet: {
      description: "The robot is instructed to open the appropriate side of the cabinet, locate the cup, remove it from the cabinet, and release it outside.",
      successMetric: "The task is considered successful once the cup is no longer detected inside the cabinet and the robot is no longer holding it.",
      objects: "A two-sided cabinet, sliding cabinet doors, and a cup.",
      keyframeCounts: "7, 8, 13, or 14",
      instructionPattern: "Take out a cup from the cabinet.",
    },
    lift_and_check: {
      description: "The robot is instructed to lift the blocks one by one, inspect the space underneath each block, locate the hidden white chip, and move the block that covers it away.",
      successMetric: "The task is considered successful once the block covering the hidden white chip has been identified and moved into the designated success region.",
      objects: "Four colored blocks, a hidden white chip or marker, and a success region.",
      keyframeCounts: "6, 11, 16, or 21",
      instructionPattern: "Lift blocks one by one to find the white chip underneath and remove it.",
    },
    swap_square_pegs: {
      description: "The robot is instructed to pick up the two square rings and exchange their positions between the pegs.",
      successMetric: "The task is considered successful once each square ring is detected on the other ring's original target peg.",
      objects: "Two square rings and three pegs.",
      keyframeCounts: "18",
      instructionPattern: "Swap the positions of the two rings.",
    },
  },
  realWorld: {
    methods: [
      { id: "pi05", name: "π₀.₅", avg: 13 },
      { id: "sam2act-plus", name: "SAM2Act+", avg: 47 },
      { id: "seek", name: "SEEK", avg: 89 },
    ],
    // Success rates (%) from overleaf_0927/sec/5_exp.tex, tab:real_world.
    // Avg. is the unweighted mean across the four tasks; no trial counts inferred.
    // Uploaded clips illustrate these tasks; they are not the complete evaluation set.
    tasks: [
      { id: "push-button", shortName: "Button", name: "Push the button N times", description: "Keep count when successive presses look alike.", successRates: [0, 32, 76] },
      { id: "stack-cups", shortName: "Cups", name: "Stack N cups on the middle cup (M total)", description: "Track the requested number of cups through the stacking sequence.", successRates: [20, 48, 100] },
      { id: "clean-desk", shortName: "Desk", name: "Clean the desk", description: "Retain the task context as the desk changes.", successRates: [0, 44, 80] },
      { id: "lift-blocks", shortName: "Chip", name: "Lift the block and look for the white piece", description: "Remember which blocks have already been checked.", successRates: [32, 64, 100] },
    ],
  },
  tasks: [
    { id: "push_button_times", title: "Push the button", category: "repetition", memory: "Remember how many presses are complete.", instruction: "Push the maroon button twice." },
    { id: "stack_blocks", title: "Stack the blocks", category: "repetition", memory: "Track how many blocks have been stacked.", instruction: "Stack 2 maroon blocks." },
    { id: "change_channel_times", title: "Change the channel", category: "repetition", memory: "Count repeated presses on the remote.", instruction: "Turn the channel minus twice." },
    { id: "stack_cups_new", title: "Stack the cups", category: "repetition", memory: "Track how many cups have been stacked.", instruction: "Stack one cup on top of the maroon cup." },
    { id: "stack_blocks_new", title: "Collect the blocks", category: "repetition", memory: "Stop after the specified number of blocks.", instruction: "Put 2 lime blocks into the rectangular container in the center." },
    { id: "weighing_on_off", title: "Weigh & relocate", category: "history", memory: "Recall the original container after weighing.", instruction: "Weigh the pepper and put it in another container." },
    { id: "pour_put_back", title: "Pour & put back", category: "history", memory: "Remember which coaster was used before.", instruction: "Pour liquid from the yellow cup to the cyan cup, then place the yellow cup on the other coaster." },
    { id: "wipe_desk_rubbish", title: "Wipe the desk", category: "history", memory: "Clear the rubbish, then wipe the desk.", instruction: "Wipe dirt off the desk." },
    { id: "light_bulb_in_out", title: "Move the light bulb", category: "history", memory: "Recall the bulb’s previous holder.", instruction: "Screw in the light bulb and move it to the other holder." },
    { id: "reopen_drawer", title: "Reopen the drawer", category: "history", memory: "Identify the drawer that was open earlier.", instruction: "Close the opened drawer, push the button, and then open the previous drawer again." },
    { id: "search_drawer", title: "Search the drawers", category: "progress", memory: "Track which drawers have been checked.", instruction: "Take item out of the drawer." },
    { id: "search_boxes", title: "Search the box", category: "progress", memory: "Track which shoes have already been removed.", instruction: "Take shoes out of box." },
    { id: "search_cup_from_cabinet", title: "Find the cup", category: "progress", memory: "Retain progress through the cabinet search.", instruction: "Take out a cup from the cabinet." },
    { id: "swap_square_pegs", title: "Swap the rings", category: "progress", memory: "Track completed steps of the swap.", instruction: "Swap the positions of the two rings." },
    { id: "lift_and_check", title: "Lift & check", category: "progress", memory: "Remember which blocks were already checked.", instruction: "Lift blocks one by one to find the white chip underneath." },
  ],
  // Source: overleaf_0927/sec/5_exp.tex, tab:main_results. Success rates (%).
  results: [
    {
        "name": "SEEK",
        "avg": 62.9,
        "repetition": 61.6,
        "history": 59.2,
        "progress": 68.0,
        "ours": true
    },
    {
        "name": "SAM2Act+",
        "avg": 51.2,
        "repetition": 46.4,
        "history": 46.4,
        "progress": 60.8
    },
    {
        "name": "RVT2",
        "avg": 42.9,
        "repetition": 43.2,
        "history": 42.4,
        "progress": 43.2
    },
    {
        "name": "SAM2Act",
        "avg": 42.7,
        "repetition": 41.6,
        "history": 39.2,
        "progress": 47.2
    },
    {
        "name": "RVT",
        "avg": 35.7,
        "repetition": 37.6,
        "history": 38.4,
        "progress": 31.2
    },
    {
        "name": "GR00T-N1.7",
        "avg": 26.4,
        "repetition": 6.4,
        "history": 49.6,
        "progress": 23.2
    },
    {
        "name": "π₀",
        "avg": 22.1,
        "repetition": 10.4,
        "history": 36.0,
        "progress": 20.0
    },
    {
        "name": "MME",
        "avg": 18.4,
        "repetition": 2.4,
        "history": 35.2,
        "progress": 17.6
    },
    {
        "name": "μVLA",
        "avg": 18.1,
        "repetition": 12.8,
        "history": 28.8,
        "progress": 12.8
    },
    {
        "name": "π₀.₅",
        "avg": 14.4,
        "repetition": 5.6,
        "history": 24.8,
        "progress": 12.8
    },
    {
        "name": "OpenVLA-OFT",
        "avg": 13.9,
        "repetition": 8.0,
        "history": 27.2,
        "progress": 6.4
    },
    {
        "name": "OpenVLA",
        "avg": 1.6,
        "repetition": 3.2,
        "history": 1.6,
        "progress": 0.0
    }
]
};
