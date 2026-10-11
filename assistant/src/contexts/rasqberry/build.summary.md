## Summary (written at build time from the website, the development branch and the 3D-model branch)

Snapshot 2026-10-11. Tags: [website: …] = rasqberry.org (gh-pages), [development: …] = branch `development` (VERSION `development-2026-10-10-171402`), [3D-model: …] = branch `3D-model`, all in github.com/JanLahmann/RasQberry-Two.

**The development branch is ahead of the published beta.** A [development] fact may not yet be in the beta a builder writes. Where it differs from the website, give the website's instruction and say that newer builds may differ.

### 1. What RasQberry Two is

RasQberry Two is a functional model of IBM Quantum System Two: a 3D-printed model with a Raspberry Pi inside that runs Qiskit, quantum demos and games and drives an LED panel in the model's wall. Software, 3D files (Apache License 2.0 [3D-model: LICENSE]) and the assembly guide are open source. Hardware comes in two tiers: **Core** (the parts for the basic model, cheap and easy to buy) and **Optional** (UPS with 18650 batteries, power switch, LED ring for the cryostat, weights). No soldering is needed, and the guide assumes little or no hardware experience. Raspberry Pi 5 recommended, Pi 4B possible; the software is an SD-card image written with Raspberry Pi Imager. It is meant for teaching, meetups, classrooms and demo booths. Every demo also runs without an IBM Quantum account, on the built-in simulator. The System One predecessor is at rasqberry.one.

### 2. Where to find what

Most of these pages are also in your context, word for word (below); the learning paths are linked only. This table says which page and section answers which question.

| Question | Page → sections |
|---|---|
| Quick start, first-boot checklist | https://rasqberry.org/ → "Getting Started", "First boot" |
| Parts, prices, links, Core vs Optional, Pi/RAM, card, power supply, filament colors and grams, magnets, screws | https://rasqberry.org/01-3d-model/01-bill-of-materials/ → "Required Components", "Core Components BOM", "Optional Components BOM" |
| STL location, 3D viewer, cooler, gluing, LED wiring and panel orientation, welding-shield filter (240 × 83 mm), Pi mounting, floor, cryostat/RTEs/door, magnet tips | https://rasqberry.org/01-3d-model/02-hardware-assembly-guide/ → "Where to find the 3D files", "Explore the model in 3D", "Mounting the fan", "Gluing all the pieces together", "Wiring up the LED Arrays", "Cutting the welding shield", "Attach the Pi to the Wall", "Assembly of the Floor", "Assembly of the Cryostat" |
| Writing the image, Imager link and customization, which image, card sizes, default login, downloads, 0 RasQberry menu, versions, venv, updates, troubleshooting | https://rasqberry.org/02-software/01-installation-overview/ → "Write the card", "Customisation", "If the link does not open Imager", "Which image?", "First start", "Downloads", "About the image", "Keeping up to date", "Troubleshooting" |
| Wi-Fi, SSH, VNC, password | https://rasqberry.org/02-software/02-system-options/ |
| A/B image: card sizes, update, what is kept, going back, Pi 4 bootloader | https://rasqberry.org/02-software/03-ab-boot/ → "Card sizes", "Update", "What an update keeps", "Go back", "Raspberry Pi 4" |
| LED wizard, LED settings, LED troubleshooting, LED Python API | https://rasqberry.org/03-quantum-computing-demos/led-display/ → "Set up your panel first", "Configuration", "Troubleshooting", "For developers" |
| Running/stopping demos, no LED panel (on-screen/browser view), booth tips | https://rasqberry.org/03-quantum-computing-demos/00-overview/ → "Running demos", "No LED panel?", "At a booth or in class" |
| Demo list and ids; guided tours | https://rasqberry.org/03-quantum-computing-demos/01-demo-list/ ; https://rasqberry.org/03-quantum-computing-demos/02-learning-paths/ |
| Standalone (floorless) model, printed LED filter, 8×32 panel cut to 8×24, beta tips, update from a branch, building images | https://rasqberry.org/04-jans-corner/tips-and-tricks/ |
| Workshops, one Pi as class server; contributing | https://rasqberry.org/workshops/ ; https://rasqberry.org/05-contributing/ |

### 3. Facts from the implementation

#### Hardware and images
- RasQberry images in the Imager list are for `pi5-64bit` and `pi4-64bit` only. The Imager list also offers plain "Raspberry Pi OS (64-bit) — without RasQberry", which also lists Pi 3. [website: public/RQB-images.json]
- The model is detected at every boot, and an SD card can move between a Pi 4 and a Pi 5. The LED driver differs: PWM on the Pi 4, PIO (RP1) on the Pi 5. An unknown model is treated as a Pi 5. [development: RQB2-bin/rq_detect_hardware.sh; stage-RQB2/02-system-integration/README.md]
- In Imager the current beta is "RasQberry Two Beta" (the A/B image, recommended) and "RasQberry Two Beta — single system", both `beta-2026-10-10-053754`. The A/B download is about 1.8 GB (12.4 GB unpacked). Dev and branch builds are under "RasQberry developer builds". [website: public/RQB-images.json]
- Release streams are dev < beta < stable. Tags `beta-*` are beta, `development-*`/`dev-*` are dev, and `v1.2.3`/`stable-*` are stable. No stable release exists yet. [development: RQB2-bin/rq_update_check.sh; website: public/RQB-releases.json]
- The development branch builds Raspberry Pi OS **Trixie** (Debian 13, Python 3.13). The website still says Bookworm and Python 3.11. [development: pi-gen-config; docs/release-notes-next.md]

#### First boot
- On the standard image the root partition grows to fill the card at the first boot, followed by a restart. An empty file `skip-expansion` on the boot partition prevents this. [development: stage-RQB2/00-firstboot-setup/README.md]
- On the A/B image `rasqberry-ab-layout.service` sets up the card instead. On a card of 58 GiB or more ("64 GB" ≈ 59.6 GiB) it makes two systems: 45 % Slot A, 45 % Slot B, 10 % DATA. A smaller card gets one system. An empty `no-auto-expand` (or `no-auto-expand.txt`) on the CONFIG partition keeps the card as written. If the power is cut during this step, the next start finishes it. Log: `/var/log/rasqberry-expand.log`. A small card cannot become a two-system card later. [development: docs/ab-boot.md]
- Imager customization on an A/B card adds an extra restart. Imager writes it to CONFIG, the Pi moves it to BOOT-A and restarts, then applies it and restarts again. It applies only on the first start of a newly written card. [development: docs/ab-boot.md; stage-RQB2/00-firstboot-setup/README.md]
- In the development branch (#319), a user name typed in Imager becomes the login (home `/home/<name>`). If the name cannot be used, the user stays `rasqberry` and the first login says why. Log: `/var/log/rasqberry-user-rename.log`. **The website says the opposite** (Customisation: keep `rasqberry`, another user name is not used). Give the website's instruction, and add that newer builds take over the typed name. [development: stage-RQB2/00-firstboot-setup/README.md; docs/release-notes-next.md]
- VNC is switched on once, at the first desktop login. After the user switches it off, it stays off. To have it switched on automatically again: `sudo rm /var/lib/rasqberry/vnc-auto-enabled`. [development: stage-RQB2/00-firstboot-setup/README.md]
- The setup checklist (`rq_firstlogin.sh`) opens by itself at desktop and SSH logins until someone answers it (Run, Later or Esc). After that it opens from the "RasQberry Setup" desktop icon or the menu. In current code the icon disappears once nothing is pending or "Don't show again" is ticked. [development: RQB2-bin/rq_firstlogin.sh]
- For about 60 s after boot the LED panel scrolls the Pi's name and IP address, and it scrolls them again when they change. Until the LED check is answered, the passes alternate between the two kit layouts, so every second pass is readable on either kit. [development: RQB2-bin/rq_display_ip.py; stage-RQB2/08-ip-display/README.md]
- A Wi-Fi watchdog (from 90 s after boot, then every minute) reconnects saved Wi-Fi profiles that NetworkManager gave up on, e.g. when the router refused the first attempts at a headless first start. [development: RQB2-bin/rq_wifi_watchdog.sh]
- A health check (`rasqberry-health-check.service`, `rq_health_check.py`) runs at every boot. It checks that the Python venv exists and Qiskit is installed, and on a trial A/B boot that the display manager came up. On a trial boot it confirms the slot or rolls back. [development: RQB2-bin/rq_health_check.py; docs/ab-boot.md]
- At start-up the Pi checks its bootloader EEPROM. If the EEPROM is older than about six months and a newer one exists, or the Pi 5 crypto service is missing, the desktop says so once and suggests `sudo rpi-eeprom-update -a` and a restart. RasQberry never updates firmware itself. [development: RQB2-bin/rq_firmware.py; docs/release-notes-next.md]

#### LED panel
- Supported layouts (`LED_LAYOUT`): `single-24x8`: the default, one 24×8 panel, 192 LEDs; `quad-4x12`: four 4×12 panels, two above two, as mounted in the model; `quad-2x2-12x4`: the legacy quad mapping; `triple-8x8`: three 8×8 panels side by side; `single-8x32`: one uncut 32×8 panel, 256 LEDs; Custom layouts go in `~/.local/config/led-layouts.json`. [development: RQB2-config/led-layouts.json; RQB2-config/CONFIG_FILES.md]
- The LED Setup Wizard (`sudo rq_led_setup_wizard.sh`) shows the IBM logo as single-24x8 in **blue, steady**, then as quad-4x12 in **yellow, blinking** (chosen for red-green color blindness); if neither reads upright, both upside down; then a per-panel walkthrough. Each answer is confirmed with a white logo before saving. "Nothing lights up / no panel" gives a wiring and power checklist and can save `LED_LAYOUT_VERIFIED=skipped`. A "diagnostic only" mode saves nothing; `--verify` is the short check of the setup checklist. Three 8×8 panels count as a single panel. [development: RQB2-bin/rq_led_setup_wizard.sh]
- Menu: `sudo raspi-config` → 0 RasQberry → Quantum Demos → LED panel → "LED setup & tests (brightness, check, wizard)" (title "RasQberry: LEDs"): Turn off all LEDs; LED brightness (weak power supply?); Text & Logo Display; Quick LED Test (6 colours); LED Test & Diagnostics; Simple LED Demo; IBM LED Demo; Check the LED Panel (which kit, which way up); Output Targets (panel / on-screen / browser); LED Setup Wizard (other panels, wiring check). [development: RQB2-config/RQB2_menu.sh]
- Brightness levels (`rq_led_brightness.sh`, or `--set low|medium|normal|bright`): Low 0.2 (cap 0.2), for a weak power supply; Medium 0.3 (cap 0.3); Normal 0.4 (as shipped, cap 1.0); Bright 0.6 (cap 1.0), needs the 27 W supply; The setting writes `LED_DEFAULT_BRIGHTNESS` and `LED_MAX_BRIGHTNESS`. After an LED stall it explains the likely cause from what the Pi reported (power or heat). It offers a lower level only when power was short. [development: RQB2-bin/rq_led_brightness.sh]
- Output Targets defaults: panel on (`LED_PHYSICAL=true`), on-screen view on (`LED_VIRTUAL=true`), browser view off (`LED_WEB=false`, port 8098). At least one stays on. [development: RQB2-config/rasqberry_environment.env; RQB2-config/RQB2_menu.sh]
- **LED settings before the first start:** the boot drive ("bootfs" on the standard image, BOOT-A on the A/B image) has `rasqberry_boot.env`. Uncomment lines such as `LED_LAYOUT=quad-4x12` to preset a whole class set. These values are applied at **every** start and override changes made later in the menu. Invalid values are skipped. Log: `journalctl -u rasqberry-boot-config -b`. [development: stage-RQB2/10-boot-config/README.md; stage-RQB2/10-boot-config/files/rasqberry_boot.env]
- Test commands: `sudo rq_led_test.sh` (interactive test); `rq_demo_run.sh led-demos led-test`; `rq_demo_run.sh led-demos` without a part lists the LED demo parts: `ibm-logo`, `text-display`, `logo-display`, `led-test`, `clear-leds`; `sudo rq_clear_leds.sh` (`--stop` also stops the program holding the panel, `--holders` lists such programs) [development: RQB2-bin/rq_help; RQB2-config/demo-manifests/rq_demo_led-demos.json; RQB2-bin/rq_clear_leds.sh; docs/release-notes-next.md]
- Own LED programs: on a Pi 5, `rq_python` drives the panel as the normal user. On a Pi 4 the PWM driver needs root, so `rq_python` starts a root LED renderer service and runs the program as the user. [development: RQB2-bin/rq_python]
- On an A/B card the LED settings are also kept on `/data`, so they survive an update into the other slot. [development: RQB2-config/CONFIG_FILES.md]

#### Commands a builder would type (`rq_help` lists them)
- Menu and setup: `sudo raspi-config`: the menu, including 0 RasQberry; `rq_firstlogin.sh --all`: the setup checklist; `rq_info.sh`: name, address, power and version; `rq_info.sh --report`: saves `~/rasqberry-report-<date>.txt` with logs for a bug report; `rq_info.sh --json`: build data as JSON; `rq_remote_access.sh status`, `sudo rq_remote_access.sh ssh on|off`, `vnc on|off`, `name NEW`; `passwd` [development: RQB2-bin/rq_help; RQB2-bin/rq_info.sh]
- Demos: `rq_demo_run.sh <demo>`; `rq_learning_paths.sh`; `rq_download_all.sh` (`--yes --docker` downloads the Docker demos too, without asking); `rq_demo_remove.sh` (`--list` shows sizes); `sudo rq_demo_loop.sh` (`--choose` picks the demos); `rq_demo_add_external.sh --list` [development: RQB2-bin/rq_help; rq_download_all.sh; rq_demo_remove.sh; rq_demo_loop.sh]
- Programming: `rq_python program.py`: the venv with Qiskit and the LED helpers. Never `sudo python3`; `rq_my_programs.sh`: JupyterLab in `~/My-Quantum-Programs`; `rq_venv_repair.sh`: reports only. `--fix-ownership` fixes root-owned files. `--reset` restores a fresh venv and keeps the old one as `<venv>.previous`. [development: RQB2-bin/rq_help; RQB2-bin/rq_venv_repair.sh]
- System: `rq_update_check.sh`: exit 0 means up to date, 10 means a newer image exists; `rq_touch_mode.sh status|enable|disable`; `sudo rq_slot_manager.sh status`; `sudo rq_after_update.sh status`; `sudo rq_expand_ab.sh status`; `cat /etc/rasqberry-version`: this slot's build. Do not use `/etc/rpi-issue` for that; `sudo poweroff` [development: RQB2-bin/rq_help; RQB2-bin/rq_update_check.sh; docs/ab-boot.md]
- `sudo rq_update_from_branch.sh --branch <b> [--repo user/repo] [--dry-run]`, `--restore`: updates scripts and configs only. It does not update packages, the kernel or the venv. [development: RQB2-bin/rq_update_from_branch.sh]

#### raspi-config "0 RasQberry" (labels as in the code)
- Software & Image Updates: "Check for a newer image", plus one entry that depends on the card: two systems: "Slot Manager (install updates, switch systems)"; A/B card not set up yet: "Prepare the card for A/B updates (64 GB or larger card)" or "Use the whole card (one system)"; A/B image on a small card: "Why there are no A/B updates on this card" [development: RQB2-config/RQB2_menu.sh]
- Slot Manager: "Install an update into the other system (Slot X)", "Switch to Slot X (restart and try it)", "Show slot details", plus confirm/rollback entries when they apply. [development: RQB2-config/RQB2_menu.sh]
- The menu is added by patching raspi-config at every boot (`rq_patch_raspiconfig.sh`, root cron `@reboot`). After an apt upgrade of raspi-config it is back after a restart. [development: stage-RQB2/02-system-integration/README.md]

#### Updates (A/B)
- An update goes into the slot that is not running. The new slot is tried once ("on probation") and becomes the start slot only after the health check confirms it. [development: docs/ab-boot.md]
- Automatic rollback: A kernel that cannot start reboots after 10 s (`panic=10`); A failed check reboots into the old slot; An unconfirmed trial is rolled back after 15 minutes. [development: docs/ab-boot.md]
- Space: the download is checked against its SHA256, then unpacked straight into the other slot. It needs the download size plus 0.5 GB free; the preflight asks for 3.0 GB. [development: docs/ab-boot.md]
- Guards: A warning before a downgrade; A typed `REPLACE` before overwriting the only beta or stable system; A typed `RASQBERRY` before installing a release older than the user-name feature when the user has another name. [development: docs/ab-boot.md]
- Kept across updates: On DATA: `~/Shared`, `~/My-Quantum-Programs`, `~/.qiskit`, Wi-Fi networks and LED settings; Copied once: password hash, hostname, time zone, locale, keyboard, Raspberry Pi Connect sign-in, SSH host keys and `authorized_keys`; Not kept: installed demos, Docker images, added Python packages and other home files. [development: docs/ab-boot.md]
- Your own packages after an update: root-owned executable scripts in `/data/rasqberry/after-update.d/` run once per release after confirmation. Log: `/var/log/rasqberry/after-update.log`. [development: docs/ab-boot.md]
- Taskbar badge: green = confirmed start slot; amber = trial start or the other slot starts next; red "!" = the last update or switch failed and the Pi went back; blue dot = newer release. On the standard image a grey "Q" badge appears only while a newer release exists. Betas are announced 3 days after release (stable 7), in a staged rollout. [development: docs/ab-boot.md]
- Command-line update: `sudo rq_update_slot.sh --preflight`, `rq_ab_releases.sh latest`, `sudo rq_update_slot.sh <ab-image-url> <release-tag>`. Only the `-ab.img.xz` image can fill a slot. Exit codes 20–29 name the reason for a refusal; e.g. 22 means not enough space and 21 means the card is not prepared or has one system only. [development: docs/ab-boot.md]

#### Logs and diagnostics
- When a demo started from a desktop icon fails, its window stays open. A copy of the output is in `~/.cache/rasqberry/<demo>.log`, and `rq_info.sh --report` collects it. [development: RQB2-bin/rq_hold_on_error.sh; RQB2-bin/rq_common.sh]
- Other logs: `journalctl -u rasqberry-firstboot.service`, `journalctl -u rasqberry-ab-layout`, `/var/log/rasqberry-expand.log`, `/var/log/rasqberry-imager.log`, `journalctl -u rasqberry-boot-config -b`. [development: stage-RQB2/00-firstboot-setup/README.md; stage-RQB2/10-boot-config/README.md]

#### Usage statistics
- The Pi sends anonymous counts to the project's Umami statistics: first start, daily update check, update result, update-notice clicks, demo starts, learning paths and LED stalls. It never sends a serial number, hostname, IP or user name. [development: docs/ab-boot.md]

### 4. 3D printing

- **Folders** in "3D Model/" on the 3D-model branch: `wall/`: R2_Wall-Base, R2_Wall-Back, R2_Wall-Lid, R2_Screw, R2_Hex_Nut, and two Back variants, `R2_Wall-Back+13` and `R2_Wall-Back-SolidForStaticModels`. The sources do not explain the variants; `floor/`: R2_Floor-Tile1 to Tile5, Tile6s, R2_Floor-all, and "Sign Magnet Indent Version" (Tile1Mag, Tile2Mag); `cryostat/`: R2_NarrowYCryoConjoined, R2_CryoLid-Simple, R2_ChandelierSingle, R2_NewDoor, R2_ScrewOctopusAlignment2, R2_NarrowServerSingleLid, and "Standalone Version" (R2_CryoStandaloneBeta, R2_CryoStandaloneGamma, R2_ServerStandalone, R2_NarrowServerSingle); `RTE/`: R2_NarrowServerSingle, R2_NarrowServerSingleLid; `union/`: empty; Most parts exist twice: the original and `*_repaired.stl`, auto-fixed by a mesh-repair workflow. Print the `_repaired` versions. [3D-model: 3D Model/; README.md; .github/scripts/stl_analyzer.py]
- **File types:** only STL, 67 files. There are no parametric or CAD source files (no STEP, SCAD or F3D). [3D-model: file listing]
- **Jan's modifications:** "3D Model - modifications - Jan/" has "October 2025" and "October 2025 - no-floor". It holds modified Wall-Base, a CryoStandaloneGamma variant, RQB2-Cryostat, an RTE single, and RQB2-WallPanel-jrl02-2.stl, a 0.6 mm printed LED filter with no `_repaired` copy. The website explains these as printer tweaks and the floorless standalone model. [3D-model: 3D Model/3D Model - modifications - Jan/; website: content/04-jans-corner/tips-and-tricks.md]
- **Approximate part sizes**, read from the STL bounding boxes (STL units, assumed to be mm): Wall-Base and Wall-Lid: about 246 × 60 mm; Wall-Back: about 245 × 10 × 81 mm; Floor tiles: 130 × 130 × 10 mm each; R2_Floor-all: 260 × 390 mm in one piece, which needs a very large bed. Otherwise print the six tiles; Cryostat core (NarrowYCryoConjoined): about 157 × 136 × 93 mm; RTE single: about 38 × 23 × 93 mm; Printed filter panel: 240.5 × 91 × 0.6 mm; The wall parts need about 246 mm of bed in one direction. The guide mentions halves glued together, but the branch contains only one-piece wall STLs. The sources do not say how to split them. [3D-model: 3D Model/ (bounding boxes computed from the STL files)]
- **Printing notes:** the parts print without supports [3D-model: README.md]. Door orientation, chandeliers, RTE count, filament and the printed filter are on the website (assembly guide, BOM, Jan's corner).

### 5. Troubleshooting

- **LED panel dark, first minute after boot:** the IP-address scroll holds the LED GPIO for about 60 s, and LED demos started then report "GPIO busy". Wait, or use "Stop a running LED demo". [development: stage-RQB2/08-ip-display/README.md]
- **LED panel dark, another program holds it:** only one process can drive the panel. `sudo rq_clear_leds.sh --holders` lists the holders and `--stop` frees the panel. [development: RQB2-bin/rq_clear_leds.sh; website: led-display "LEDs not turning on"]
- **LEDs stop after a while (Pi 5):** too little power or too much heat. Use the official 27 W supply, lower the brightness, and fit the Active Cooler. [development: RQB2-bin/rq_led_brightness.sh]
- **Text or logos scrambled or upside down:** run the LED Setup Wizard so it sets `LED_LAYOUT`. On older images, text and logos read the retired `LED_MATRIX_LAYOUT` and came out scrambled on the four-panel kit. [website: led-display; development: RQB2-config/RQB2_menu.sh comments]
- **LED layout comes back after reboot even though the wizard changed it:** check `rasqberry_boot.env` on the boot drive. Uncommented values there win at every start. [development: stage-RQB2/10-boot-config/files/rasqberry_boot.env]
- **Wrong LED colors:** check `LED_PIXEL_ORDER`. The default is GRB. [development: RQB2-config/rasqberry_environment.env]
- **LED wiring on old images:** images older than the 2025-12-30 beta used SPI and a different wiring. Current images use GPIO 18 on pin 12, 5 V on pin 2 and GND on pin 6. [website: hardware assembly guide]
- **Wi-Fi offline after a headless first start:** the watchdog retries saved profiles every minute. By hand: `nmcli connection up preconfigured` (Imager's profile name). [development: RQB2-bin/rq_wifi_watchdog.sh]
- **Pi not found on the network:** with several Pis named rasqberry, the later ones become `rasqberry-2.local`, `-3`, … in no fixed order. Use "Name this RasQberry" or `sudo rq_remote_access.sh name NEW`. [development: RQB2-bin/rq_remote_access.sh]
- **A/B card still at about 10 GB / Slot B a 16 MB placeholder:** Cause: `no-auto-expand` on CONFIG, or a card written from an older image; Check: `sudo rq_expand_ab.sh status`; Fix: Software & Image Updates → "Prepare the card for A/B updates". [development: stage-RQB2/00-firstboot-setup/README.md]
- **Black screen after an update:** power cycle; the previous slot starts. If that fails, set `boot_partition=2` under `[all]` in `autoboot.txt` on CONFIG (3 for Slot B). [development: docs/ab-boot.md; website: ab-boot "Go back"]
- **Updating from a round-3 beta A/B card:** the old update menu stops with a false "corrupted" error. Run from a terminal on Slot A: `sudo rq_update_slot.sh <URL of the -ab image> <release tag> --slot B > ~/update.log 2>&1`, or write a new card. [development: docs/release-notes-next.md]
- **Firmware updates on an A/B card:** older code put an EEPROM update into the running slot, which can stop a Pi 4 from starting. Current code stages it on CONFIG. [development: RQB2-bin/rq_firmware.py; docs/release-notes-next.md]
- **Raspberry Pi Connect from Imager does not sign in:** update the EEPROM (`sudo rpi-eeprom-update -a`, restart), then sign in from the taskbar. [development: docs/release-notes-next.md]
- **0 RasQberry missing from raspi-config:** restart (the menu is re-patched at boot), or run `sudo /usr/bin/rq_patch_raspiconfig.sh`. [development: stage-RQB2/02-system-integration/README.md]
- **Python environment broken** ("Permission denied" on pip, missing jupyter): `rq_venv_repair.sh --fix-ownership` or `--reset`. [development: RQB2-bin/rq_venv_repair.sh]
- **VNC not on after first login:** `sudo raspi-config nonint do_vnc 0`; check `systemctl status wayvnc.service`. [development: stage-RQB2/00-firstboot-setup/README.md]

### 6. Not covered by the sources

Say these are not covered instead of guessing:

- Pi 3, Zero, 400/500, Compute Modules, USB/NVMe boot (the images list Pi 4 and Pi 5 only).
- Print settings (layer height, infill, nozzle, temperatures, print times); filament per part (the BOM gives grams per color); bed size beyond the part sizes above.
- How to split the wall parts for small printers; the purpose of `R2_Wall-Back+13`, `R2_Wall-Back-SolidForStaticModels` and the floor "Sign Magnet Indent Version".
- Mounting and wiring of the optional parts (X1203 UPS, LED ring, power switch); any software for the LED ring.
- Panels other than WS2812/WS2812B, other GPIO pins in practice, level shifters, and how to wire the separate 5 V supply the guide recommends for a brighter panel.
- Tested touchscreen models; resin printing or laser cutting; prices beyond the BOM's December 2024 list.
- When a stable release comes, and whether a given beta is Bookworm or Trixie (check System Info or `rq_info.sh`).
