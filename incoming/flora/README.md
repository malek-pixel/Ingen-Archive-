# Drop botanical imagery here

Name each file after the flora record id. Extension can be .png, .jpg or .webp.

    serenna-veriformans.png      ING-FLR-001
    cycadeoidea.png              ING-FLR-002
    araucaria-mirabilis.png      ING-FLR-003
    dicksonia-antarctica.png     ING-FLR-004  Ancestral Tree Fern
    bennettitales-composite.png  ING-FLR-005
    equisetum-giganteum.png      ING-FLR-006  Giant Horsetail
    ginkgo-adiantoides.png       ING-FLR-007  Ancestral Ginkgo
    wollemia-nobilis.png         ING-FLR-008  Wollemi Pine
    cycas-revoluta-cultivar.png  ING-FLR-009  Sago Cycad
    microvictoria.png            ING-FLR-010
    pachypteris.png              ING-FLR-011

Then run:

    npm run images:flora

That converts everything to WebP at the 1200px cap, writes the paths and
dimensions into src/data/flora-images.json, and drops map entries whose file
has gone. Records without a file keep the drawn technical plate.
