# Collector badge icons: prompts for ChatGPT

21 badges. Every one of them is defined in `badges.json`; the names and colours below come from there.

## How to use

1. Paste the **style block** into ChatGPT once, as its own message.
2. Then send one badge line per message, e.g. `Badge: five_boroughs ...`.
3. Download each as PNG, 1024 by 1024, transparent background.
4. Save it as `NEW YORKERS SITE/assets/badges/<id>.png`, using the id in the table (e.g. `five_boroughs.png`).
5. Rebuild (`./build_all.sh`, or just `python3 build_collectors.py && python3 build_my.py`). Any badge with a
   PNG shows the picture on the leaderboard, on My NEW YORKERS and on the downloadable card. Badges without
   one keep their emoji, so they can be made a few at a time.

## Style block (send once)

> I am making a set of 21 collector badges for NEW YORKERS, an art collection by MLow that paints the people of
> New York City. Make every badge in exactly the same style so they read as one set:
> a round enamel pin medallion, seen straight on, centred, filling about 90% of a square 1024 by 1024 canvas,
> **transparent background**, no drop shadow outside the circle. A thin polished metal rim in the badge's accent
> colour, then a deep night navy enamel field (#141820). In the middle, one bold, simple, instantly readable
> emblem in the painterly NEW YORKERS look: rich oil paint texture, glowing neon accents, and somewhere small in the
> design a white flower whose centre is a blue evil eye (MLow's signature). Limited palette: the accent colour I
> give you, white, the navy, and a touch of electric acid yellow (#D7FF1F). **No words, no letters, no numbers, no
> logos, no text of any kind.** The emblem must still read when the badge is shown 24 pixels wide, so keep it to one
> big shape with strong contrast. Reply to each badge I send with one image only.

## The badges

| # | id (file name) | Badge | Accent | Earned by | Badge line to send |
|---|---|---|---|---|---|
| 1 | `mayor` | The Mayor | #FFD23F gold | Number one on the board | Badge: mayor. Accent #FFD23F gold. Emblem: the crown of the Statue of Liberty, glowing gold, with a small evil eye flower set in the centre ray like a jewel. The most regal badge of the set. |
| 2 | `borough_president` | Borough President | #FF6B6B coral red | Hold 50 or more | Badge: borough_president. Accent #FF6B6B coral red. Emblem: the dome and columns of a Beaux Arts civic building, like Borough Hall, front on, with a tiny evil eye flower in the pediment. |
| 3 | `landlord` | Landlord | #FF9F43 orange | Hold 25 or more | Badge: landlord. Accent #FF9F43 orange. Emblem: an old brass skeleton key on a ring, with a brownstone stoop silhouette cut into the bow of the key and an evil eye flower on the ring. |
| 4 | `block_captain` | Block Captain | #F7B731 amber | Hold 11 or more | Badge: block_captain. Accent #F7B731 amber. Emblem: a vintage megaphone pointed up and to the right, with sound waves made of small petals, an evil eye flower at the mouth of the horn. |
| 5 | `regular` | Regular | #C8A27A tan | Hold 5 or more | Badge: regular. Accent #C8A27A warm tan. Emblem: the classic blue and white Greek deli paper coffee cup, steam rising in a curl that ends in an evil eye flower. |
| 6 | `counted` | Counted | #9AA5B1 silver grey | Hold one New Yorker | Badge: counted. Accent #9AA5B1 silver. Emblem: a single bold check mark painted in white over a census tally of four strokes, an evil eye flower where the strokes cross. The simplest badge of the set. |
| 7 | `five_boroughs` | Five Boroughs | #4D96FF blue | One from all five boroughs | Badge: five_boroughs. Accent #4D96FF blue. Emblem: a flower with exactly five petals, each petal a different tone of blue, arranged like the five boroughs, with the evil eye at the centre where they meet. |
| 8 | `bridge_and_tunnel` | Bridge and Tunnel | #6BCB77 green | Three of the five boroughs | Badge: bridge_and_tunnel. Accent #6BCB77 green. Emblem: the arch of a suspension bridge tower above, the round mouth of a tunnel below, a subway headlight in the tunnel shaped like an evil eye flower. |
| 9 | `whole_family` | The Whole Family | #B983FF violet | One of every family, all thirteen | Badge: whole_family. Accent #B983FF violet. Emblem: a ring of thirteen small flowers in a wreath, each slightly different, around a larger evil eye flower in the middle. |
| 10 | `whole_timeline` | The Whole Timeline | #00C2A8 teal | One from every era | Badge: whole_timeline. Accent #00C2A8 teal. Emblem: an hourglass whose falling sand is made of tiny flower petals, the evil eye flower caught at the waist of the glass. |
| 11 | `time_traveler` | Time Traveler | #38B2AC sea green | Five or more eras | Badge: time_traveler. Accent #38B2AC sea green. Emblem: an old Grand Central style four faced clock seen from one side, its centre replaced by an evil eye flower, the hands spinning with motion streaks. |
| 12 | `set_complete` | Set Complete | #FFD700 bright gold | Every piece of one set | Badge: set_complete. Accent #FFD700 bright gold. Emblem: a gleaming trophy cup with an evil eye flower embossed on the bowl, small sparkles around it. The rarest badge; make it feel precious. |
| 13 | `set_started` | Started a Set | #E056FD magenta | Three of one set | Badge: set_started. Accent #E056FD magenta. Emblem: three interlocking jigsaw puzzle pieces with one empty gap, an evil eye flower painted across the joined pieces. |
| 14 | `local` | Local | #FF7AA2 pink | Three from one neighbourhood | Badge: local. Accent #FF7AA2 pink. Emblem: a map pin standing on a small street grid, the head of the pin an evil eye flower. |
| 15 | `keystone` | Keystone | #C6FF00 acid green | Hold a KEYSTONE | Badge: keystone. Accent #C6FF00 acid green. Emblem: the wedge shaped keystone at the top of a stone arch, carved and lit from within, an evil eye flower carved into its face. |
| 16 | `founder` | Founder | #F9F871 pale yellow | KEYSTONE and the census | Badge: founder. Accent #F9F871 pale yellow. Emblem: a five pointed star rising out of a stone keystone, the evil eye flower at the star's centre. |
| 17 | `day_one` | Day One | #FF8C42 sunrise orange | Minted on 23 September 2026 | Badge: day_one. Accent #FF8C42 sunrise orange. Emblem: the sun rising between Manhattan towers, the sun itself an evil eye flower, rays in orange and acid yellow. No numbers or dates. |
| 18 | `first_111` | First 111 | #FFB4A2 peach | One of the first 111 tokens | Badge: first_111. Accent #FFB4A2 peach. Emblem: a vintage admission ticket stub with a torn edge, an evil eye flower printed where the ticket number would be. No digits. |
| 19 | `lifer` | Lifer | #90BE6D sage green | Minted and never sold | Badge: lifer. Accent #90BE6D sage green. Emblem: a brownstone stoop with a lit doorway, a potted evil eye flower growing on the top step. Rooted, staying put. |
| 20 | `moving_picture` | Moving Picture | #5AC8FA sky blue | Holds an animated piece | Badge: moving_picture. Accent #5AC8FA sky blue. Emblem: a curl of 35mm film strip, the middle frame showing an evil eye flower, motion lines along the strip. |
| 21 | `glitched` | Glitched | #FF2E63 hot pink | Holds a glitch edition | Badge: glitched. Accent #FF2E63 hot pink. Emblem: an old CRT television with a datamoshed, pixel shifted evil eye flower on its screen, RGB split and scan lines. |

## Notes

- If ChatGPT puts text on a badge, reply "same badge, remove all text" rather than starting over; the style stays.
- If one comes back on a white background, ask for "the same image with a transparent background".
- Keep the eye blue on all of them. It is the thread that makes 21 different icons one set.
