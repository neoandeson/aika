const banner = `
  ╔══════════════════════════════════════════════════════════╗
  ║                                                          ║
  ║   ░█▀▀░▀█▀░█░█░█▀█                                      ║
  ║   ░█▀▀░░█░░█▀▄░█▀█    AI Kit Awareness                  ║
  ║   ░▀▀▀░▀▀▀░▀░▀░▀░▀    v${process.env.npm_package_version || "0.1.1"}                            ║
  ║                                                          ║
  ║   One project. Many kits. Zero conflicts.                ║
  ║                                                          ║
  ╠══════════════════════════════════════════════════════════╣
  ║                                                          ║
  ║   Get Started:                                           ║
  ║                                                          ║
  ║   1. cd your-project                                     ║
  ║   2. aika init                                           ║
  ║                                                          ║
  ║   Commands:                                              ║
  ║     aika init       Set up hooks + MCP registration      ║
  ║     aika uninstall  Clean removal, no side effects       ║
  ║     aika --help     Full command reference                ║
  ║                                                          ║
  ║   GUI Dashboard:                                         ║
  ║     https://github.com/neoandeson/aika-app               ║
  ║                                                          ║
  ╚══════════════════════════════════════════════════════════╝
`;

console.log(banner);
