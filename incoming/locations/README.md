# Drop location imagery here

Name each file after the location record id. Extension can be .png, .jpg or .webp.

    isla-nublar.png          ING-LOC-001  survey map
    isla-sorna.png           ING-LOC-002  (still needed)
    jurassic-park.png        ING-LOC-003  illustrated park map
    jurassic-world.png       ING-LOC-004  PARK.CTRL satellite map
    lockwood-estate.png      ING-LOC-005  manor exterior
    biosyn-valley.png        ING-LOC-006  valley complex
    ile-saint-hubert.png     ING-LOC-007  technical survey map
    nublar-north.png         ING-LOC-008  (still needed — Sector 5)
    nublar-lagoon.png        ING-LOC-009  lagoon stadium
    sorna-interior.png       ING-LOC-010  (still needed — river basin)
    ingen-hq.png             ING-LOC-011  Palo Alto campus
    mantah-corp-island.png   ING-LOC-012  (identity unconfirmed)

Then run:

    npm run images:locations

That converts everything to WebP at the 1200px cap, writes the paths into
src/data/location-images.json, and verifies every reference resolves.
Records without a file keep the technical plate — partial coverage is fine.
