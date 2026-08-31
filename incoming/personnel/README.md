# Drop personnel imagery here

Name each file after the personnel record id. Extension can be .png, .jpg or .webp.
These 12 records currently render the drawn technical plate (empty path in
`scripts/_ingen_data.raw.json` → `pImg`):

    donald-gennaro.png       ING-CHR-***  Attorney — Cowan, Swain & Ross
    roland-tembo.png         ING-CHR-***  Game Hunter / Expedition Field Leader
    lex-murphy.png           ING-CHR-***  Endorsement Tour Visitor
    tim-murphy.png           ING-CHR-***  Endorsement Tour Visitor
    billy-brennan.png        ING-CHR-***  Palaeontology Graduate Assistant
    paul-kirby.png           ING-CHR-***  Civilian — Private Search Party
    eric-kirby.png           ING-CHR-***  Civilian — Recovered Survivor
    lowery-cruthers.png      ING-CHR-***  Systems Analyst / Control Room
    gerry-harding.png        ING-CHR-***  Chief Veterinarian
    ken-wheatley.png         ING-CHR-***  Mercenary Team Leader
    eli-mills.png            ING-CHR-***  Estate Manager / Foundation Ops
    ramsay-cole.png          ING-CHR-***  Head of Communications — Biosyn

Unlike locations, personnel imagery has no single ingest command. The steps are:

1. Copy the source file into `public/media/personnel/`.
2. Add its path to `pImg` in `scripts/_ingen_data.raw.json`, keyed by record id:
   `"gerry-harding": "public/media/personnel/gerry-harding.png"`
3. `npm run data`     rebuilds src/data/ingen.json from the raw file
4. `npm run images`   converts to WebP at the 1200px cap and rewrites the paths
5. `npm run verify:assets`  confirms every reference resolves and nothing is orphaned
