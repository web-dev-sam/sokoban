import { writeFileSync } from "fs";

type LevelData = {
  t: string;
  a: string;
  e: string;
  u: string;
  l: string;
};

function parseSokobanFile(fileContent: string): LevelData[] {
  const lines = fileContent.split('\n');

  // Extract global metadata
  let globalAuthor = '';
  let globalEmail = '';
  let globalUrl = '';

  for (const line of lines) {
    if (line.startsWith('Author:')) {
      globalAuthor = line.substring('Author:'.length).trim();
    } else if (line.startsWith('E-mail:')) {
      globalEmail = line.substring('E-mail:'.length).trim();
    } else if (line.startsWith('URL:')) {
      globalUrl = line.substring('URL:'.length).trim();
    }
  }

  // Extract levels
  const levels: LevelData[] = [];
  let currentLevel: string[] = [];
  let inLevel = false;
  let currentTitle = '';
  let currentAuthor = '';

  for (const line of lines) {
    // Check for title and author info
    if (line.startsWith('Title:')) {
      currentTitle = line.substring('Title:'.length).trim();
    } else if (line.startsWith('Author:') && inLevel) {
      currentAuthor = line.substring('Author:'.length).trim();
    }

    // Level detection - a line starting with a level-specific character
    if (line.match(/^[-#@ $.+*]/)) {
      inLevel = true;
      currentLevel.push(line);
    } else if (inLevel && line.trim() === '') {
      // End of level
      if (currentLevel.length > 0) {
        const processedLevel = processLevel(currentLevel);
        if (processedLevel) {
          levels.push({
            t: currentTitle,
            a: currentAuthor || globalAuthor,
            e: globalEmail,
            u: globalUrl,
            l: processedLevel
          });
        }
        currentLevel = [];
        currentTitle = '';
        currentAuthor = '';
      }
      inLevel = false;
    } else if (line.startsWith('Title:') && currentLevel.length > 0) {
      // Title line marks the start of a new level, finish the previous one
      const processedLevel = processLevel(currentLevel);
      if (processedLevel) {
        levels.push({
          t: currentTitle,
          a: currentAuthor || globalAuthor,
          e: globalEmail,
          u: globalUrl,
          l: processedLevel
        });
      }
      currentLevel = [];
      currentAuthor = '';
    }
  }

  // Process the last level if it exists
  if (currentLevel.length > 0) {
    const processedLevel = processLevel(currentLevel);
    if (processedLevel) {
      levels.push({
        t: currentTitle,
        a: currentAuthor || globalAuthor,
        e: globalEmail,
        u: globalUrl,
        l: processedLevel
      });
    }
  }

  optimizeLevelFormat(levels);

  return levels;
}

function optimizeLevelFormat(levels: LevelData[]) {
  for (let i = 0; i < levels.length; i++) {
    levels[i].l = compressString(levels[i].l);
  }
  return levels;
}

function compressString(input: string): string {
  // Split the input by lines
  const lines = input.split('|');
  const compressedLines: string[] = [];

  for (const line of lines) {
    let compressed = '';
    let count = 1;
    let currentChar = line[0];

    for (let i = 1; i <= line.length; i++) {
      // If the current character is the same as the previous one, increment count
      if (i < line.length && line[i] === currentChar) {
        count++;
      } else {
        // If we have more than one of the same character, add the count
        if (count > 1) {
          compressed += count.toString() + currentChar;
        } else {
          compressed += currentChar;
        }
        
        // Reset for next character
        if (i < line.length) {
          currentChar = line[i];
          count = 1;
        }
      }
    }
    compressedLines.push(compressed);
  }

  return compressedLines.join('|');
}

function processLevel(levelLines: string[]): string | null {
  let maxWidth = 0;
  for (const line of levelLines) {
    maxWidth = Math.max(maxWidth, line.length);
  }

  const grid: string[] = [];

  for (const line of levelLines) {
    const row: string[] = [];
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      // Keep all Sokoban notation characters as specified
      switch (char) {
        case '#': row.push('#'); break;    // Wall
        case ' ': row.push(' '); break;    // Space/Floor
        case '@': row.push('@'); break;    // Player
        case '+': row.push('+'); break;    // Player on target
        case '$': row.push('$'); break;    // Box
        case '*': row.push('*'); break;    // Box on target
        case '.': row.push('.'); break;    // Target
        case '-': row.push(' '); break;    // Empty (treat as space)
        default: row.push(' ');            // Default to space
      }
    }

    // Ensure each row has the same width
    while (row.length < maxWidth) {
      row.push(' ');
    }

    if (row.some(cell => cell !== ' ')) {
      grid.push(row.join(""));
    }
  }

  return grid.length > 0 ? grid.join("|") : null;
}


// Example usage
const fileContent = `
  ####
###  ####
#     $ #
# # $#$ #
# ...#@ #
#########
Author: David W. Skinner + Jordi Domenech
Title: Microban #3
Comment: added a box

##### #####
#   ###   #
#  $ $ $#@#
#  #...   #
###########
Author: David W. Skinner + Jordi Domenech
Title: Microban #6
Comment: stoned many floors, reaganged boxes

#####
#   ##
#@$  #
## $ ####
 ###$.  #
  #  .# #
  #  .  #
  #######
Author: David W. Skinner + Jordi Domenech
Title: Microban #12
Comment: added a box

#####
# + #
#.*.#
#$$$##
#    #
#    #
######
Author: David W. Skinner + Jordi Domenech
Title: Microban #17
Comment: added a box

 ######
 #    #
##... #
# $$$ #
#@  ###
#####
Author: David W. Skinner + Jordi Domenech
Title: Microban #25
Comment: stoned 2 floors, rearranged boxes

  ####
###  ####
#  $    #
#@$***. #
#  .    #
#########
Author: David W. Skinner + Jordi Domenech
Title: Microban #34
Comment: added a box

  #######
###     #
# $ $   #
# ### #####
#   ..*.$ #
#   ### @ #
##### #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #47
Comment: added 2 boxes

######
# @  #
#  # #
# $$ #
# $ ##
### #
 #. ####
 #.    #
 #.    #
 #######
Author: David W. Skinner + Jordi Domenech
Title: Microban #49
Comment: rearranged boxes and goals, stoned 2 floors

 #####
##. .##
# $$$ #
# ... #
# $ $ #
## @ ##
 #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #53
Comment: change wall for a box, moved 2 goals

############
#          #
# #######  ##
# #         #
# #  $   #  #
# $$$#####  #
###@ #  #...#
  ####  #  .#
        #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #59
Comment: added a box, stoned 2 floors

   ###
   #@#
####$####
#   .   #
# ## ## #
# #   # #
# #   # #
# #   # #
# ##$## #
#  $ $  #
###...###
  # * #
  #   #
  #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #66
Comment: added 2 boxes

####  ####
#  ####  #
#  #..#  #
# $# .  $##
#  $ .#$  #
#  ##.# $ #
#     #  @#
###########
Author: David W. Skinner + Jordi Domenech
Title: Microban #69
Comment: added 2 boxes, rearranged goals

#####
#   ####
#      #
# $ $$@#
##$##  #
 # #####
##.. #
# .. #
#    #
######
Author: David W. Skinner + Jordi Domenech
Title: Microban #70
Comment: redrraw map

###########
#     #   ###
# $ $ # .   #
# ## ###*## #
# #     $ # #
# #   #   # #
# ###### ## #
#       . . #
####### @ ###
      #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #71
Comment: extension, added 2 boxes
Date: 2010.10.14

 #######
##     #
#  $ $ #
# $ $ $#
## ### ##
 #   ...#
 ##. @ .#
  #######
Author: David W. Skinner + Jordi Domenech
Title: Microban #78
Comment: stoned 4 floors, rearranged goals

######
#    ##
#  $  #
##$$$ #
 # #  #
 # ## ##
 # $...#
 #  . .#
 # @####
 ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #83
Comment: added a box, stoned 2 floors

########
#  ... #
#  ### #
#  # $ ##
## #@$  #
 # # $  #
 # ###.#####
 #       $ #
 #   ###   #
 ##### #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #84
Comment: added a box

     ####
 # ###  #
 # #    #
 # #$ #.#
 # #  # #
 # #$ #.# #
   #  # # #
####$ #.# #
#     $.# #
# @ #  ## #
########
Author: David W. Skinner + Jordi Domenech
Title: Microban #88
Comment: reduction map, added a box

########
#  @   #
# $  $ #
##$## ##
# $..$ #
#  .. .#
########
Author: David W. Skinner + Jordi Domenech
Title: Microban #90
Comment: added a box, stoned 4 floors

  ####
  #  ##########
  #     $   $ #
  #  ######.# #
####  $   ... #
#   $$# ###.# #
#   # @ # #   #
######### #  ##
          #  #
          ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #92
Comment: added 2 boxes, major changes

     #
 ##########
 #   #    #
 # $ # $  #
 #  *.*   #
####.@.####
 #  *.*  #
 # $ # $ #
 #   #   #
 #########
     #
Author: David W. Skinner + Jordi Domenech
Title: Microban #93 a
Comment: stoned many floors

 #########
###  ##  ##
# $  .  $##
#  $ # $  #
## #*.*   #
##.#.@.#.##
#   *.*# ##
#  $ # $  #
##$  .  $ #
##  ##  ###
 #########
Author: David W. Skinner + Jordi Domenech
Title: Microban #93 b
Comment: added 4 boxes, major changes

##### #####
#   ###   #
#  *. .*  #
###$ . $###
  # $*$ #
###$ . $###
#  *.@.*  #
#   ###   #
##### #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #105
Comment: added 3 boxes, stoned many floors

  #######
# #     #
# # # # #
  # $   #
###$### #
#   ### #
# $  ##.#
## $  #.#
 ## $  .#
# ## $#.#
## ## #.#
### # @.#
### #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #109
Comment: added a box

  ####
  #  #
  # $####
###. .  #
# $$. $ #
#  . .###
####$ #
   # @#
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #110
Comment: change wall for a box

######
#    ####
#    ...#
#    ...#
###### ##
  #  # #
  # $$ ##
  #  $  #
  #@$$  #
  ## $# #
   #    #
   ######
Author: David W. Skinner + Jordi Domenech
Title: Microban #111
Comment: stoned 2 floors

    #####
#####   ###
#     #   #
#  #..... #
## ### # ##
 #$$ $$$ #
 #   @ ###
 #######
Author: David W. Skinner + Jordi Domenech
Title: Microban #115
Comment: stoned 2 floors

 ####
 #  ######
 #  $    ##
##..####  #
#  .   ## #
#...#$  #@#
# ## $$ $ #
#  $    ###
####  ###
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #117
Comment: added a box, stoned some floors

 ##########
##....... #
# $$$$$$$@#
#   # # # #
#   #     #
###########
Author: David W. Skinner + Jordi Domenech
Title: Microban #126
Comment: reduction map

########
#   #  ###
#   $ $. #
### #  . #
 ##$###.##
 #  $  . #
 # $## . #
 #@ ######
 ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #127
Comment: added a box, major changes
Date: 2010.10.14

  #########
### @ #   #
# * * * . #
#   $ #   #
####*## ###
 #       #
 #   #   #
 #########
Author: David W. Skinner + Jordi Domenech
Title: Microban #129
Comment: moved a goal, some changes

        ####
#########  #
#   ## $   #
#  $   ##  #
### #...# ##
  # #.$.#$##
  # #.$ #  #
  #   $    #
  # @#######
  ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #134
Comment: added 2 boxes

 ####
 #  ####
##  ...#
#   ...#
#   # ##
#   #  #### ####
##### $   ###  #
    #  ##$ $   #
   ###     $$  #
   # $  ## @ ###
   #    ######
   ######
Author: David W. Skinner + Jordi Domenech
Title: Microban #139
Comment: stoned a floor

   ####
 ###  #####
 # $$ #   #
 # $ ...$$##
 # .* #* $ #
###.#   .  #
#  .   #.###
# $ *# *. #
##$$... $ #
 #   # $$ #
 #####@ ###
     ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #144
Comment: rearranged 4 goals/boxes

    ####
   ##@ #
  ##   ##
###.$$$.##
#  $...$ ##
#  $...$  #
## $.*.$  #
 ##.$$$.###
  ##   ##
   #  ##
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #145 a
Comment: change wall for box, added 4 walls

   #####
   #   #
  ##   ##
###.$$$.###
# .$...$$ #
#  $.#.$  #
# $$.+.$. #
###.$$$.###
  ##   ##
   #   #
   #####
Author: David W. Skinner + Jordi Domenech
Title: Microban #145 b
Comment: added 2 boxes

################################################
#                      #                       #
# #################### #  #################### #
# #                  # #  #                  # #
# # ################ # # $# ################ # #
# # #              # # #  # #              # # #
# # # ############ # # # $# # ############ # # #
# # # #          # # # #  # # #          # # # #
# # # # ######## # # # # $# # # ######## # # # #
# # # #        # # # # #  # # # #        # # # #
# # # ######## # # # # # $# # # # ######## # # #
# # #          # # # # #  # # # #          # # #
# # ############ # # # # $# # # ############ # #
# #              # # # #  # # #              # #
# ################ # #*##$# # ################ #
#                  #  ..... #                  #
######################.##.######################
#                  # ...+.  #                  #
# ################ # #$##*# # ################ #
# #              # # #  # # # #              # #
# # ############ # # #$ # # # # ############ # #
# # #          # # # #  # # # # #          # # #
# # # ######## # # # #$ # # # # # ######## # # #
# # # #        # # # #  # # # # #        # # # #
# # # # ######## # # #$ # # # # ######## # # # #
# # # #          # # #  # # # #          # # # #
# # # ############ # #$ # # # ############ # # #
# # #              # #  # # #              # # #
# # ################ #$ # # ################ # #
# #                  #  # #                  # #
# ####################  # #################### #
#                       #                      #
################################################
Author: David W. Skinner + Jordi Domenech
Title: Microban #154 Take the long way home
Comment: extension. Revised 27-1-2020

      ####              ####
##### #  ################  ##
#   ###$        .           #
# $      #################  #
# $ ####   $ #  ####  ####.##
### # .#*# # #     #     # #
  # #$.#   . # ##  # ##  # #
 ## ...### ###  # ##  # # $#
 #   # # #      #     # #  #
 #   # ###  #####  #### #  #
 ##### $ #####  #######.#####
 #   # # #  #               #
## # #   #  #  #######  ##  #
#   *#########  #    ##### ##
# #$            # $        #
# @ #########  ##########  #
#####       ####        ####
Author: David W. Skinner + Jordi Domenech
Title: Microban #155 The Dungeon
Comment: added 10 boxes, small changes. Revised 27-1-2020

#####
#   #
#   ##
#$$$@#
#... #
######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #10
Comment: stoned 2 floors

 #####
 #   #
 # # #
##*..#
# $ ##
# $  #
# @  #
######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #17
Comment: rearranged goals/boxes

 ####
 #  ###
 #$.  #
 # .# #
##$.  #
# $ ###
# @ #
#####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #20
Comment: moved a goal

     #####
######   #
#  @## # #
# $$$    #
### ###$###
#        .##
#   ###... #
#####    # #
    # #  # #
    # #### #
    #      #
    ########
Author: David W. Skinner + Jordi Domenech
Title: Microban II #24
Comment: added 2 boxes

#######
#  +  #
# *$* #
#. # .#
#  #  #
#  #  #
# $#$ #
#  #  #
#######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #27
Comment: reduction map

######
#    #
# ##$###
# # $  #
# ..*. #
##  $  #
 #@# ###
 #   #
 #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #29 a
Comment: extension, added a box

######
#    #
# ##$###
# # $  #
#  .*..#
# # $  #
# @  ###
######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #29 b
Comment: extension, added a box

######
#    #
# ##$#####
# # $    #
# ..*..# #
##  $    #
 #@#$#####
 #   #
 #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #29 c
Comment: extension, added 2 boxes

######
#    #
# ##$####
# # $   #
#...*.. #
##  $ # #
 #@#$ $ #
 #   ####
 #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #29 d
Comment: extension, added 3 boxes

  ########
  #  #   #
  #  $   #
  #  ##$##
#### ##  #
#  ...#$ #
#  $ .   #
###### @##
     ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #31
Comment: added a box

########
#  #   #
#      #
#  ## ###
## ##$$ #
## ## #@#
# . .$. #
#   #####
#####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #46
Comment: reduction map

  ####
###  #
#    #
# .$.##
##$#$ #
 #.$. #
 #    #
 ##@ ##
  ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #49
Comment: stoned 2 floors

#######
#  $. #
#  $. #
###  ###
 # $.  #
 #@$.  #
 #######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #51
Comment: stoned 4 floors

 ######
 #    ###
 # $  $ #
###$# # ##
# .$...  #
#   ## @ #
##########
Author: David W. Skinner + Jordi Domenech
Title: Microban II #59
Comment: added a box, redraw map

   ####
   #  #
   # .###
   #$.  #
#### .$ #
#  $$.###
#   @ #
#######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #62
Comment: stoned 2 floors

######
#    #
# ## #
# # *###
# #@*  ##
# # *   #
# # * $ #
# ## #.##
#    ###
######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #65
Comment: added a wall

     #####
     #   #
     # # #
     #   #
#######. #
#    $.*$#####
# # $*  .#   #
#   #.  *$ # #
#####$*.$    #
    # .#######
    #   #
    # # #
    # @ #
    #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #66
Comment: added 2 boxes

   ####
  ##  ##
 ## *. ##
## $ .$ ##
#  .$  * #
# *  $.  #
## $. $ ##
 ## .* ##
  ##@ ##
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #67
Comment: added 2 boxes

     #
    #.#
   # $ #
  ##   ##
 #  ***  #
#.$ *@* $.#
 #  ***  #
  ##   ##
   # $ #
    #.#
     #
Author: David W. Skinner + Jordi Domenech
Title: Microban II #68
Comment: stoned 4 floors

########
#  #   #
#  #...#
# $$$$$#
#  #.*.#
#  #   #
#  @  ##
#######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #70
Comment: added a wall and a box

  #####
  #   ###
 ## #   ###
 #  .$#   #
## #$.$.# #
#  $.+.$  #
# #.$.$# ##
#   #$.  #
###   #$##
  ###   #
    #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #77
Comment: added a box

 #####
 #   ###
##.#   ##
# $ $#  #
# .$    #
##.$##  #
 #.@#####
 ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #79
Comment: stoned 2 floors, redraw map

 ####
 #  ######
 # $#  . ###
 #   $ # @ #
 ## # $ $  #
  # ##..####
  # ##. #
### ### ###
#     $   #
#   ###.  #
##### #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #81
Comment: added a box, stoned 2 floors

 #########
 #       ##
 #.####   #
##.$ @ $$ #
# .*.$ #  #
# ### ## ##
#        #
##########
Author: David W. Skinner + Jordi Domenech
Title: Microban II #82
Comment: added a wall

     ######
    ## .  ##
    #. .$  #
    #.  #  #
    ## ##  #
   ##  #####
  ## $ #
 ## $  #
## $  ##
# $  ##
#.@ ##
#####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #87
Comment: added a box, stoned 2 floors

    ####
  ###  #
 ## .  #
##     #
# .$. ##
# $ ###
# .$###
###   #
  #$# #
  # @ #
  #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #93
Comment: reduction map

#########
#       ####
#    ## #  #
## ### $ $ #
# ...# $$$ #
#    @     #
##..########
 ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #95
Comment: stoned 4 floors

#####
#   ###
# # $ ##
# #.$  #
# #.$#@#
# #.$  #
#  .$###
##$.  #
 # .  #
 ######
Author: David W. Skinner + Jordi Domenech
Title: Microban II #98
Comment: added a box and change wall for a box

 #####
 # . #####
 #$ $$ $ #
 #  ... .#
##$.  *$ #
# $*  .$##
#. ...  #
#@$ $$ $#
##### . #
    #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #109
Comment: added 2 boxes

    #####
#####   #
# $...$ #
# $*@*$ #
# $...$ #
#   ##  #
#########
Author: David W. Skinner + Jordi Domenech
Title: Microban II #112 a
Comment: stoned 4 floors

#########
#       #
# $...$ #
##$*@*$##
# $...$ #
#       #
#########
Author: David W. Skinner + Jordi Domenech
Title: Microban II #112 b
Comment: change position walls

###########
#    #    #
#  * . *  #
##*$*@*$*##
#  * . *  #
#    #    #
###########
Author: David W. Skinner + Jordi Domenech
Title: Microban II #113
Comment: added a wall

      #####
    ###   #
    #   # #
    # #   #
##### $ $#####
#   ##$#.#   #
# # $....$$# ##
#    #.@.#    #
## #$$....$ # #
 #   #.#$##   #
 #####$ $ #####
    #   # #
    # #   #
    #   ###
    #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #114
Comment: added 4 boxes

      #
     # #
    #   #
   # .$. #
  # .$.$. #
 # .$$$$$. #
# .$.$+$.$. #
 # .$ $ $. #
  # .$*$. #
   # .$. #
    #   #
     # #
      #
Author: David W. Skinner + Jordi Domenech
Title: Microban II #115
Comment: added 3 boxes

########
#  #   #
#      #
#  ## ##
##  #  #########
 #  #  #       #
 #  #  $ $ $ $ #
##$### ####### #
# $  . . . . ..#
# @ ############
#####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #116
Comment: added 2 boxes, deleted 3 walls

     #####
     #   ##
######  $ ##
#   ###  $ ##
#     ##  $ #
#...#  ##   #
#      ##$  #
#...# ## $ ##
##### # $  #
    #  @  ##
    #  ####
    ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #118
Comment: added a wall

     ####
   ###  ######
   #         #
  ##$  $## # #
  #  #  ## $ ##
  #    ## $$  #
##### $   #   #
#   #  ########
#     ##
#......#
#   @  #
########
Author: David W. Skinner + Jordi Domenech
Title: Microban II #120
Comment: stoned 2 floors

 #######
 #     #
 # $$  #
 #  $###
 # #  #
 # #$ #
 # #  #
## ##.##
#    . #######
# ###...     #
#   #.#### $ #
### #.# $ $$ #
  #  .  @ #  #
  ############
Author: David W. Skinner + Jordi Domenech
Title: Microban II #126 a
Comment: stoned 2 floors, moved a goal

 #######
 #     #
 # $$  #
 #  $###
 # #  #
 # #$ #
 # #  #
## ##.#
#    .########
# ###...     #
#   #.#### $ #
### #.# $ $$ #
  #  .  @ #  #
  #########  #
          ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #126 b
Comment: moved a goal, added a wall

            ####
           ##  ###
          ##  @  #
         ##  *$  #
        ##  **  ##
       ##  **  ##
      ##  **  ##
     ##  **  ##
    ##  **  ##
   ##  **  ##
  ##  **  ##
 ##  **  ##
##  **  ##
#  **  ##
# **  ##
#. ####
####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #130
Comment: moved a goal

                  #####
            ##### #   #
            #   ### # #
      ##### # #*    * #
##### #   # #   #### ##
#   ### # # ### #  # #
# #$   @* #   # #  # ###
#   ####.###### ####   #
### #  #......$ #  . # #
  # #  #  ## .#.   #   #
 ## #####  ##... # #####
 # $       ##  ### #
 # # ###$#$ #####  # #####
 #   # #    # #    # #   #
 ##### #  ##### $#$### # #
       # ###  ##       $ #
   ##### #  $ ##  ##### ##
   #   #    #  ##  #  # #
   # #    # $      #  # ###
   #   #### ###### ####   #
   ### #  # #   #      $# #
     # #  # ### # # ###   #
    ## ####   # #   # #####
    # $    $# # #####
    # # ###   #
    #   # #####
    #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #132 The Mixer
Comment: added 15 boxes. Revised 28-1-2020

            ##### # #####
           ##   ######  ##
          # #           # #
         ##### #######  ####
        ##   #  #   ## ##  ##
       # #      # # #      # #
      ##### ##  ##.##   #  ####
     ##   #  ####   ##### ##  ##
    # #      # #     # #      # #
   ##### ##  ##  #    ##   #  ####
  ##   #  ####   # #   ##### ##  ##
 # #      # #    # #    # #      # #
##### ##  ##     # # #   ##   #  ####
#   #  ####   ## # $ #    ##### ##  #
#      # #        .# # #   # #      #
## ##  ##   ###### $ # #    ##   #  #
## #####           # #       ##### ##
 # #  #   ###$#$## # # #####  #  # #
## # #.       .   +   .       .# # ##
 # #  #  ##### # # ##$#$###   #  # #
## #####       # #           ##### ##
#  #   ##    # # $ ######   ##  ## ##
#      # #   # # #.        # #      #
#  ## #####    # $ # ##   ####  #   #
####  #   ##   # # #     ##  ## #####
 # #      # #    # #    # #      # #
  ##  ## #####   # #   ####  #   ##
   ####  #   ##    #  ##  ## #####
    # #      # #     # #      # #
     ##  ## #####   ####  #   ##
      ####  #   ## ##  ## #####
       # #    $ #   #      # #
        ##  ## ## # #  #   ##
         ####  ## # ## #####
          # #  $ .#.    # #
           ##  ######   ##
            ##### # #####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #134 Stargate
Comment: added 9 boxes

          ####
          #  #          ####
      #####  #          #  #         ####
      #   #  #      #####  #         #  #
      #     ####    #   #  #     #####  #
      ####   . #    #     ####   #   #  #
         # #   #   #####   . #   #     ####
         # #####   #   # #   #  #####     #
     ##### ##  #####     #####  #   # #   #
     #   # ##  #  #####     #####     #####
     #     ##  #  #  ## #   #  #####   . ####
     ####     ##  #  ## #####  #  ## #   #  #
       #  ##     ##  ## #####  #  ## #####  #
       #  #  ##     ###       ##  ## #####  #
       #  #  #  ##       ###     ###       ####
       ####  # $#  ##### ##  ##       ###     #
         #####  # $##### ## $#  ##### ##  #   #
         #  #####  #   # ##  # $##### ## .#####
     #####  #  ##### . $ #####  #   # ##  #
     #   #  #  #  ##### $ . #####     #####
     #     #####  #   #.#   #  #####     #
    #####     ##### . $ #####  #  #  #   #
    #  ## #   #  ##### $ . #####  #  #####
#####. ## #####  #  ## #   #  #####  #
#   #  ## #####  #  ## #####  #  #####
#     ###       ##  ## #####  #  #  ####
####       ###     ###       ##  #  #  #
  #  ##### ##  ##       ###     ##  #  #
  #  ##### ## $#  ##### ##  ##     ##  #
  #  #   # ##  # $##### ## $#  ##     ####
  #### .   #####  #   # ##  # $#  ##     #
    #####     #####     #####  #  ## #   #
    #   # #   #  #####     #####  ## #####
    #     #####  #   #$#   #   ##### #
    ####     #   # .   #####   #   # #
      #  #   #   ####     #    # .   ####
      #  #####     #  #   #    ####     #
      #  #         #  #####      #  #   #
      ####         # @#          #  #####
                   ####          #  #
                                 ####
Author: David W. Skinner + Jordi Domenech
Title: Microban II #135 Fractal
Comment: added 12 boxes. Revised 28-1-2020

#######
#     #
# .$$ #
##. ###
# .$$ #
# . # #
#   @ #
#######
Author: David W. Skinner + Jordi Domenech
Title: Microban III #3
Comment: added a box, rearranged boxes

################
#  #  #  #  #  #
#. .  #  #$ #$ #
# $#  *  # .#  #
#  #. #  *  #$ #
# $# $#  #  . .#
#  #  # @#  #  #
################
Author: David W. Skinner + Jordi Domenech
Title: Microban III #8
Comment: added 4 boxes

####
#  #####
#      #
# .#.# #
##$$$$ #
# . .###
# @  #
######
Author: David W. Skinner + Jordi Domenech
Title: Microban III #15
Comment: added a wall and a floor

    ####
 ####  ##
 #  # * ##
##.$#  * ##
#     * * #
# @ #  *  #
######    #
     ######
Author: David W. Skinner + Jordi Domenech
Title: Microban III #20 a
Comment: stoned 2 floors

   ####
####  ##
#  # * ##
#.$#  * ##
#    * * #
# @#  *  #
######   #
     #  ##
     ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #20 b
Comment: stoned 3 floors

    #####
   ##   #
   #  @ #
#### #$##
#...  . #
#  ###  #
## $ $ ##
 #  $ ##
 ###  #
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #21
Comment: added a box

   ######
   #  . #
   #  $ #
   ## #######
#####   ##  #
#  #  *     #
#.$# *+* #$.#
#     *  #  #
#  ## $ #####
####### ##
    # $  #
    # .  #
    ######
Author: David W. Skinner + Jordi Domenech
Title: Microban III #23 a
Comment: added a box, stoned many floors

    ####
    #  ###
    # $. #
    #  $ #
    ## ########
 #####   ##   #
 #  # .*.   $ #
##.$# *@* #$.##
# $   .*. #  #
#   ##   #####
######## ##
     # $  #
     # .$ #
     ###  #
       ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #23 b
Comment: added 4 boxes

    ####
    #  ###
    #  . #
    #  $ #
    ## ########
 #####    #   #
 #  # ***     #
##.$# *+* #$.##
#     *** #  #
#   #     ####
######## ##
     # $  #
     # .$ #
     ###  #
       ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #23 c
Comment: added 5 boxes, deleted 3 walls

    ####
    #  ###
    # $. #
    #  $ #
    ## ########
 ####.   .#   #
 #  # ***   $ #
##.$# *@* #$.##
# $   *** #  #
#   #.   .####
######## ##
     # $  #
     # .$ #
     ###  #
       ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #23 d
Comment: added 8 boxes, deleted 4 walls
Date: 2010.10.6

    ####
    #  ###
    # $. #
    #  $ #
    ## ########
 #####  ###   #
 #  ## .    $ #
##.$# .*. #$.##
# $    . ##  #
#   ###  #####
######## ##
     # $  #
     # .$ #
     ### @#
       ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #24 a
Comment: added a box

    ####
    #  ###
    # $. #
    #  $ #
    ## ########
 #####  ###   #
 #  ##.*      #
##.$# * * #$.##
#      *.##  #
#   ###  #####
######## ##
     # $  #
     # .$ #
     ### @#
       ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #24 b
Comment: added 2 boxes

#########
#   ## .#
#      .#
## #$# .#####
 # #   .##  #
## ####  $$ #
#  #   ##$  #
#        @ ##
#  #########
####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #27
Comment: some changes on the left side, added a wall

####  ####
#  ####  #
# $$  $$ #
# .$..$. #
## .@ . ##
 ########
Author: David W. Skinner + Jordi Domenech
Title: Microban III #28
Comment: stoned 4 floors

###########
#         ##
# ### ###  #
# .*.*.*.  #
#   $+$   ##
###$###$###
  #  $   #
  #  #   #
  #  #####
  ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #30
Comment: extension

       ####
  ###### .#
###      .#
#  $$ # ..#
# $  #  .##
#  $$# #.###
###  # $*  #
  #    # # #
  #####    #
      # @ ##
      #####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #31
Comment: added 2 boxes

           #######
          ##     #
         ##  ### #
         #  $ $  ##
         # $ $ $  #
 #########  # # @ #
 # . . . # ########
##   .   $   $ #
#  . . . # #   #
# ######## #####
#          #
############
Author: David W. Skinner + Jordi Domenech
Title: Microban III #33
Comment: added a box

     ####
   ### @#
   #  $ #
   #    #
  ### ###
 ## $$ #
##.....#
#   $$ #
# # #  #
#   ####
#####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #39
Comment: stoned 5 floors

   ########
   #   #  #
   #    $ #
 #####$## #
 #   # ##.#
 #   #  #.#
 ##  $  #.#
  #  #  #.#
  #$#####.#
### #  ##.##
#      $   #
# $#   # @ #
#      #####
########
Author: David W. Skinner + Jordi Domenech
Title: Microban III #40
Comment: some changes at the bottom

#####
#   #######
#  . . . .#
## $ $ $  #
######@####
#  $ $ $ #
#  . . . #
#######$ #
      #  #
      ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #42
Comment: added a box, change position goals

#####    #####
#. #######   #
# $ #####  $ #
#  $ ###  $ ##
##  $ #  $ ###
 ##  .... ###
 ### .##*####
 ####*##. ###
 ### ....  ##
### $  # $  ##
## $  ### $  #
# $  ##### $ #
#@  ####### .#
#####    #####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #46
Comment: added 2 boxes
Date: 2010.10.7

  #########
  #       #
### # # # ###
#  $.$.$.$  #
# #.$.$.$.# #
# .$.# #.$$ #
# #.$ @ $.# #
# $$.# #.$. #
# #.$.$.$.# #
#  $.$.$.$  #
### #.#$# ###
  #       #
  #########
Author: David W. Skinner + Jordi Domenech
Title: Microban III #57 a
Comment: added 3 boxes

  #########
  #       #
### # # # ###
#  $.$.$.$  #
# #.$.$.$.# #
#  $.# #.$# #
# #.$ @ $.# #
# #$.# #.$  #
# #.$.$.$.# #
#  $.$.$.$  #
### # ### ###
  #       #
  #########
Author: David W. Skinner + Jordi Domenech
Title: Microban III #57 b
Comment: added 3 walls

###############
#             #
# # # # #$#.# #
# .$.$.$.$.$  #
# #.$.$.$.$.# #
# $$.$.$.$.$  #
# #.$.$.$.$.# #
#  $.$.@.$.$  #
# #.$.$.$.$.# #
#  $.$.$.$.$$ #
# #.$.$.$.$.# #
#  $.$.$.$.$. #
# #.#$# # # # #
#             #
###############
Author: David W. Skinner + Jordi Domenech
Title: Microban III #58
Comment: added 4 boxes

#################
#               #
#*...*######### #
#.$$$.  $       #
#.$@$.######### #
#.$$$.    $     #
#*...*######### #
#  $        $   #
# ############# #
#               #
#################
Author: David W. Skinner + Jordi Domenech
Title: Microban III #59
Comment: added 3 boxes, rearranged goals/boxes

     ####
######  #
#   ##@ #
#    #$.#
##    $.#
 ##  #$.#
  ####  #
     ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #64 LOMA 1e
Comment: stoned 4 floors

 #####
 #   #
##   #
# * ##
#.@$#
# * #
#  ##
####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #89 LOMA 8a
Comment: stoned 3 floors

 #####
##   #
# *  #
#.@$##
# *  #
##   #
 #####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #91 LOMA 8c
Comment: stoned 2 floors

 ######
 #    ##
## ##  #
# . ## #
# .  # #
# .  # #
###$$$ #
  #@ ###
  ####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #92 LOMA 8d
Comment: change position goals and boxes

     #####     #####     #####     #####
     #   #######   #######   #######   ####
     # # #  #### # #  #### # #  #### # #  ##
     #       ###       ###       ###       ##
    #### #    #### #    #### #    #### #    ##
#######   #    ##   #    ##   #    ##   #    #
#   ###    #    #    #    #    #    #    # $ #
# # #  #    #    #    #    #    #    # ** #  #
#       #    #    #    #    #    #    #    ###
### #    #    #    #    #    #    #    #    ##
 #   #    #    #    #    #    #    #    #    #
 #    #    #    #    #    #    #    #    #   #
 ##    #    #    #    #    #    #    #    # ###
 ###    #    #    #    #    #    #    #       #
 ####    #    # ** #    #    #    #    #  # # #
######    #    #    #    #    #    #    ###   #
#   ###    #    #    # ** #    #    #    ######
# # #  #    #    # ** #    #    #    #    ####
#       #    # ** #    #    # ** #    #    ###
### #    #    #    #    # ** #    #    #    ##
 #   #    #    #    # ** #    #    #    #    #
 #    #    #    # ** #    #    #    #    #   #
 ##    #    # ** #    #    # ** #    #    # ###
 ###    #    #    #    # ** #    #    #       #
 ####    #    #    # ** #    #    #    #  # # #
######    #    #    #    #    #    #    ###   #
#   ###    #    #    #    # ** #    #    ######
# # #  #    #    #    #    #    #    #    ####
#       #    #    #    #    #    #    #    ###
### #    #    #    #    #    #    #    #    ##
 #   #    #    #    #    #    #    #    #    #
 #    #    #    #    #    #    #    #    #   #
 ##    #    #    #    #    #    #    #    # ###
 ###    #    #    #    #    #    #    #       #
 #  # ** #    #    #    #    #    #    #  # # #
 # . #    #    #    #    #    #    #    ###   #
 #  @ #   ##    #   ##    #   ##    #   #######
 ##    # ####    # ####    # ####    # ####
  ##       ###       ###       ###       #
   ##  # # ####  # # ####  # # ####  # # #
    ####   #######   #######   #######   #
       #####     #####     #####     #####
Author: David W. Skinner + Jordi Domenech
Title: Microban III #101
Comment: added 30 boxes

#####  ####
#   #  #  #
# $ ####$ ##
#  $.... $ ##
##  ####  @ #
 #  #  #    #
 ####  #  ###
       ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #6
Comment: stoned 2 floors

    ####
    #  #
  ###$.##
###     #
# . **  ###
# $ *@* $ #
### *** . #
  #     ###
  ##.$###
   #  #
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #9 a
Comment: added a box

    ####
    #  #
  ###$.##
###   * #
# .* *  ###
# $ *@* $ #
###    *. #
  # *   ###
  ##.$###
   #  #
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #9 b
Comment: added a box, moved 3 goals

#######
#  #  ###
#.$#  * ##
#  @ * * #
#  ##    #
#####  ###
    ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #15 a
Comment: stoned 3 floors

#######
#  #  ###
#.$#    ##
#  @ * * #
#  ## *  #
#####   ##
    #####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #15 b
Comment: stoned 2 floors, moved a goal

  ####
  #  #####
 ##      #
 # .**$  #
## #  # ##
#  ***. #
# $    ##
##### @#
    ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #18
Comment: added a box

 #######
 #  .  #
 #  $# #
###$$+.##
 #  $# #
 #  .  #
 #######
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #22
Comment: moved 2 goals
Date: 2010.10.6

     #####
 #####   #
 #  ##$# ##
## **  $  #
# .*.+# $ #
#  ** #   #
##   ######
 #   #
 #####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #28
Comment: added a box, moved a goal
Date: 2010.10.6

 #######
#   .   #
# #$#$# #
# $. .$ #
#.# $ #.#
# $...$ #
# #$#$# #
#   +   #
 #######
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #35
Comment: added a box

 #######
##     ##
# $.$.$ #
# .$.$. #
# $.*.$ #
# .$.$. #
# $.$.$ #
##  @  ##
 #######
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #38
Comment: added a box

     ####
     #  #### #####
     #     # #   ######
     # $$  # #        #
   ####  $## ##....  .#
   #    $ ##  ##  #. .#
#### ##$#  #   #  #. ##
#  $$##@## ######### ###
# #    $               #
#   ### ### ########   #
##### #     #      #####
      #######
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #42 Classic level #1 revised
Comment: added a box, stoned 3 floors

         ####
##########  #
#   $   ... #
#  $ $   #  #
#### #### . #
  # $  @  ###
  #   #####
  #####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #44
Comment: stoned 2 floors

########
#   #  ####
# # @     #
# # * $$# #
#  #*##   #
##  *.  ###
 ##.* ###
  #  ##
  #  #
  ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #45
Comment: added a box

    ########
    #  @   #
 ####$$#$# ##
 #          #
 # ##*##### #
 # # .... # #
## # .... # ##
#  #####$##  #
# $  $    $$ #
###   #   #  #
  ############
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #46
Comment: added a box and a wall, small changes
Date: 2010.8.31

 ####
 #  #######
##.$#  *  #
#     * * #
# @ #  *  #
######* ###
     #   #
     #   #
     #####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #55
Comment: stoned 2 floors

#########
###    ##  ####
#    * ##  #  #
# ****  ####$.##
#  *@*      $..#
#  **** ####   #
## * $  #  #####
##    ###
#########
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #57
Comment: added a box

 ####
 #  ###
 # $* #######
 #  . $ #   #
###.# . $ # #
#   .*#*. $ #
# # $ . #@###
#   # $ .  #
####### *$ #
      ###  #
        ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #62
Comment: added a box

    ####
#####  #
# $.$ *#
#  . . ###
###*. $$ #
 # .#.   #
##$. $.###
# $ #$ #
# @    #
########
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #73
Comment: added a wall

 #####
 #   #
 # # ####
 # $.*  #
 # .$ * #
###*#$.@#
#  .$ * #
# #$.*  #
#    ####
#   ##
#####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #77
Comment: stoned 2 floors

  ####
  #  #
  # $#
###  #
# $ $###
# ..$  #
##.@*  #
 #.. ###
 #.$$###
 #. $  #
 ###   #
   #####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #78
Comment: stoned many floors

#######
#   @ #
# $ $ #####
####$...  #
   # .# * ###
   #$...$#  #
   # .#.$ $ #
   #$.$$.   #
   #  #  ####
   ####$ #
      #  #
      ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #80
Comment: stoned many floors

  #######
  #  #  #
  # $$$ #
  #.....#
####$.$##
#   $. ###
# $  .   #
####$.$  #
   # @####
   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #82
Comment: stoned 4 floors

   ####    #####
   #  #    #   #
   # $#    #$# ##
   #  ######    #
   ## . $ .  $# #
#####$.#.#. #   #
#   # .#.#.$#####
# $ @ .$. . #
####  $.$.$ ##
  #  ######  #
  # $#    #$ #
  #  #    #  #
  ####    ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #85 ("W" letter)
Comment: redraw map
Date: 2010.9.22

       #
 #############
 ## *     .  #
 # .$.$$$.$. #
##.$*$.*.$*$.##
 # .$.$$$.$. #
 #@ .     *  #
 #############
       #
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #89
Comment: added 2 boxes, a wall

      # #
 #############
 ##   .$.   ##
##.$  $.$  $.##
 #$.*** ***.$#
##.$  $.$  $.##
 ##@  .$.   ##
 #############
      # #
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #90
Comment: added 4 walls

      ###
 #############
 ## $.   .$  #
##  *$.$. *  ##
## .$.$*$.$. ##
##  * .$.$*  ##
 ##@$.   .$ ##
 #############
      ###
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #91
Comment: added 2 boxes, 3 walls

     # # #
 #############
 #         . #
 # .**$  **$ #
###*  ***  *###
 # $**  $**. #
 #@.         #
 #############
     # # #
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #92 a
Comment: added 2 walls, moved 2 boxes

     # # #
 #############
 # $       . #
 # .**   **$ #
## *  ###  * ##
 # $** # **. #
 #@.       $ #
 #############
     # # #
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #92 b
Comment: stoned 3 boxes, added a wall

     ## ##
 #############
##   .   .   ##
## $$*$$$*$$ ##
 #.....#.....#
## $$*$$$*$$ ##
##@  .   .   ##
 #############
     ## ##
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #93
Comment: stoned a box

   ### # ###
 #############
 ###   .     #
## .$ $$$.$. ##
##*$.*...*.$*##
## .$.$$$ $. ##
 #@    *   ###
 #############
   ### # ###
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #94
Comment: added a box, 4 walls

  ### #### ###
 ##############
##    #       ##
 #$.$  .$.$.$.#
##.$.$.$.$.$.$##
##$.$.$.$.$.$.##
 #.$.$.$.  $.$#
##@      #    ##
 ##############
  ### #### ###
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #97
Comment: added 2 walls

  ## # ## # ##
 ##############
##    .  $    ##
##**.**$$**.**##
 #  $ ...$ $  #
 #  $ $... $  #
##**.**$$**.**##
##@   $  .    ##
 ##############
  ## # ## # ##
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #98
Comment: added 2 boxes

                      ####   ##### ####
           ########   #  #   #   ###  #
 ###########  #   #####  #   #        #
##            #          ######## ##  #
#  ###### $   ## ###### ##  #   #  # ####
# ........#####  #   #      #      # #  #
## ###### ##  #      #   #  ## ##  # #  #
 # #   #      #  ## ###### ###  #### #  #
##     #   #  ####  #   #       #  # # ##
#  ## ###### ##  #      #   ##  #      #
#  #  #   #      #  ## ##########  ##$ #
#  #      #   #  ##### #     #  ## ##  ##
####  ## ###### ##   # #   $ #      #   #
   ##### ##  #     $   #  ####  #   #   #
   #   #  # $#   ##  # ## #  ## #########
   #      #  #########  # #      #   #  #
##### ##  #             # #  #   #      #
#   #  ####   #######  ## ## ###### ##  #
#      #  #####  ## ##### ##  #   #  # ##
### #  #          #     # # $ #      # #
  # ####  ### ##  #    ## #   ## ##  # #
  # #  ## ##   # ##    #  ## ###  #### #
  # #      # $ # #     #          #  # ###
 ## #  #   #  ## ##### ##  #####  #      #
 #  ## ###### ## ##  #######   ####  #   #
 #      #   #  # #             #  ## #####
 #  #   #      # #  #########  #      #
 ######### ##  # ## #  ##   #$ #  #   #
 #   #   #  ####  #   $     #  ## #####
 #   #      # $   # #   ## ###### ##  ####
 ##  ## ##  #     # #####  #   #      #  #
  # $##  ########## ##  #      #   #  #  #
  #      #  ##   #      #  ## ###### ##  #
 ## # #  #       #   #  ####  #   #     ##
 #  # ####  ### ###### ##  # $  $ #   # #
 #  # #  ## ##  #   #      #  ## ###### ##
 #  # #      #      #   #  #####*+...... #
 #### #  #   #  ## ###### ##   $ ######  #
   #  ## ########          #     $      ##
   #        #   #  #####   #  ###########
   #  ###   #   #  #   ########
   #### #####   ####
Author: David W. Skinner + Jordi Domenech
Title: Microban IV #101
Comment: added 15 boxes, redraw goals area
Date: 2010.8.31`;

const result = parseSokobanFile(fileContent);

writeFileSync("./public/beginners2.json", JSON.stringify(result))
