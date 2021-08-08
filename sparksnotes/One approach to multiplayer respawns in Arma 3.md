#post #draft

# Brief Context
Hiya! It's always felt to me that Arma 3, despite its robust and active modding / custom content scene, is not very well documented and often requires lots of bumbling around in 5yr old forum posts with incomplete answers in order to learn anything.

Well, this is my attempt to add something of value so that someone new might have a *slightly* easier time. [Click here to skip to the main content!](#Table-of-Contents)

**DISCLAIMER**: I am a relative noob when it comes to this stuff. I'll explain how I set my mission up, but your results may vary.

Further, this post **assumes some foundational knowledge**, such as:
- Being able to open the Zeus editor / open or create a new mission file,
- Some level of familiarity with navigating the editor and selecting / placing objects and modules,
- Some understanding of what a Trigger is,
- The concept of what a variable is, and not being scared to write/adapt a couple lines of code that I will provide :)

## My custom mission/gamemode: "The Hunt"
In short, the mission I will be breaking down here is called "the hunt", the repo for which can be found [here](https://github.com/spark-c/ARMA3-the-hunt) on my github. Full game info and rules can be found in the README.md.

Here is the mission description:
![the-hunt-map]

> 3-8ish players. An island off the SE coast of Malden. Opfor spawns ON the island with equipment favoring long-range engagements. Their mission is to eliminate Blufor, OR destroy both objective caches on the island. Blufor spawns just across the water on the mainland with equipment favoring short/medium-range engagements. Their mission is to eliminate Opfor, or defend the objectives for the specified period of time (currently 30 minutes).

After some playtesting early on, it became clear (through no small amount of crashing into rocks, bushes, getting *ARMA'd* only minutes after starting the mission) that in order to prevent players dying immediately and twiddling their thumbs for 30 minutes, there needed to be some sort of respawn mechanic. It also makes room for players to try high-risk / high-reward tactics.

After having just recently done some bugfixes, the following is my working solution.

---

# Table of Contents
- [Brief Context](#Brief-Context)
- [Approach](#Approach)
- [Multiplayer "Respawn" Settings](#Multiplayer-Respawn-Settings)
- [Respawn Delay](#Respawn-Delay)
- [Spawn/Respawn Position](#Spawn-and-Respawn-Position)
- [Loadouts](#Loadouts)
- [Spectating](#Spectating)
- [Wrap-up](#Wrap-up)

## Specifications
(Numbered list for later reference to specific points)
1. Each side should have a set number of respawn tickets.
    - All players on a side being eliminated with no more tickets results in game-end.
    - If Blufor has no living players, even if there are tickets remaining, they lose anyway.
1. Each side should have its *own* respawn delay time. Opfor has shorter delay.
1. At mission start, players should spawn at specific starting locations. *After that*, however, any *re*-spawns should take place at the side's designated respawn position.
1. On respawn, players should be given one of the gamemode-specific loadouts. (*NOT* the default!)
1. While waiting to respawn, players should spectate a teammate in 1st person only.


## Approach
To begin, I'm using the Respawn module via Zeus editor (with tiny scripts as needed). This can be found via "Assets > Systems (F5) > Multiplayer > Respawn Position". Once selected, you can click to place this module down where-ever you'd like the respawn position to be.

> Note: It can be hard to tell the *depth* of the module icon in the Zeus editor. That is to say, double-check that your marker is not floating in the air or sunk into the ground by lowering the camera to ground-level and taking a look from that angle.

> If the marker is accidentally set on a roof or in the ground, you can hold/drag the module with the mouse and adjust its height by *HOLDING ALT* while you drag it. The ALT key will constrain its movement to only the up/down axis.

Double-click (or Right-Click > Attributes) to open up the Attributes window for this module. If this position will be used for *only* one side (as it is in my case), in the "System: Init" tab, you'll want to give this position a variable name. This is how we will refer to this point in the future.

I think setting names for the respawn points is technically overkill in this case, because I'll be allowing players to manually "select" their spawnpoint (more on that later). HOWEVER, if you will not be taking players to a spawn select screen, you'll need to set a name for the point.

Arma has a special convention for these respawn point names. The name **MUST START** with the following prefix, according to the side:

|Side       |Name Prefix      |
|-----------|-----------------|
|Blufor     |`respawn_west`    |
|Opfor      |`respawn_east`    |
|Independent|`respawn_guerila`* |
|Civillian  |`respawn_civillian`|
*\*the word is misspelled, but this is the correct spelling according to ARMA.*

For example, one of my Blufor points is named `respawn_west_4`. ARMA 1) recognizes this as a Blufor spawnpoint, and 2) will tell players that it is called "4".

References:
- [Describes how ARMA selects a spawnpoint for units / naming conventions](http://killzonekid.com/arma-scripting-tutorials-respawn-on-marker/)
- [Official BI reference for respawn](https://community.bistudio.com/wiki/Arma_3:_Respawn)


[Table of Contents](#table-of-contents)

---
### Multiplayer Respawn Settings
These can be found in the top bar of the Zeus editor, under the "Attributes > Multiplayer" tab.

First, under the "Respawn" tab, I've set the drop-down menu called "Respawn" to "Respawn on Custom Position".

Then, there are four "Rulesets" boxes to be checked:
- Select respawn position (this will have ramifications later. See [Spawn and Respawn Positions](#Spawn-and-Respawn-Positions))
- Select respawn loadout (we will handle this in [Loadouts](#loadouts))
- Show respawn counter
- Subtract tickets upon respawn


[Table of Contents](#table-of-contents)

---
### Tickets
In "Attributes > Multiplayer > Respawn" you can also set the number of respawn tickets that each side may have. I did this with code because I have future plans to accomodate; however, you can do it either way.

If you'd like to accomplish this via code, you can set the values fairly easily! In your mission directory (i.e. /mpmissions/MISSION-NAME/), check to see whether there is a file called "init.sqf". If it is not present -- create it!

>This can be done by making a new .txt file, and then renaming it / changing the file extension to be .sqf. If you cannot see the file extensions, make sure you've enabled the "File Name Extensions" checkbox in your File Explorer > View tab (Windows).
>
> Most text editors should allow editing this file just like a .txt; if yours does not (i.e. regular Notepad.exe), you can either find a more robust text editor (like Notepad++), or change the extension to .txt, make your edits, and then change it back to .sqf. 

> NOTE: The init.sqf file will be run between the mission *lobby* and the mission *start*.

For respawn tickets, the contents of init.sqf will look something like this:
```
// init.sqf

[west, 2] call BIS_fnc_respawnTickets; // BLUFOR
[east, 1] call BIS_fnc_respawnTickets; // OPFOR
```

The use of this function is just `[side, #tickets] call BIS_fnc_respawnTickets;`! Not too bad.

> This function can also live in other places in the mission to accomplish different tasks. For example, you could set up a trigger somewhere in the mission to detect when a BLUFOR soldier makes it to a certain zone. When the trigger activates, this function can be used in the trigger body to reset the BLUFOR respawn ticket counter (i.e. a checkpoint).
> 
> ![respawntickets-trigger.png]

[Table of Contents](#table-of-contents)

---
### Loadouts
Players are given very specific loadouts as a part of the balance of this gamemode, and we need to make sure that they also *re*spawn with one of these preset loadouts; if we don't set this up specifically, then players will simply be given the default equipment defined by ARMA's config.

To deal with this, we'll need to add our own custom Role (CfgRoles) classes and Loadout (CfgRespawnInventory) classes to this mission's description.ext file.

Just like the init.sqf file -- if you have not already added a "description.ext" file to your mission, go ahead and do so!

> "The description.ext is a mission config file and is used to set the overall mission attributes or to define global properties that will be available for other scripts"
> [Reference](https://community.bistudio.com/wiki/Description.ext)

We'll be adding the two previously-mentioned classes to the file: CfgRoles and CfgRespawnInventory.

#### CfgRoles
This one isn't too bad at all! For each role we'd like to create, we'll need just a couple of 
TODO


[Table of Contents](#table-of-contents)

---
### Spawn and Respawn Positions
This was one of the first of the more difficult problems to address. I want players to spawn on the set respawn points after they are killed, *however*, I don't want them spawning there at the very beginning of the mission. 

[Table of Contents](#table-of-contents)

---

### Respawn Delay
This one was a little of a tougher one! To recap, I wanted the setup to be like so:
- Blufor spawn delay should be twice as long as Opfor spawn delay
- Players should select their spawnpoints, including


[Table of Contents](#table-of-contents)

---

### Spectating
TODO
[Table of Contents](#table-of-contents)

---
## Wrap-up
TODO
[Table of Contents](#table-of-contents)