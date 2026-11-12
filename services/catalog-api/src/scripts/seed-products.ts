const IMAGE_QUERY = '?w=800&h=600&fit=crop&auto=format&q=80';

const image = (id: string) => `https://images.unsplash.com/${id}${IMAGE_QUERY}`;

export const SEED_PRODUCTS = [
  {
    name: 'Clay Terracotta Tea Set',
    description:
      'Six cups and a pot thrown by potters in Dhamrai, Dhaka district, from local red clay and fired in a wood kiln. The inside of each piece carries a food-safe glaze, while the outside keeps the natural terracotta finish. The pot holds about 700 ml and each cup about 90 ml. Wash by hand with mild soap and dry fully before storing.',
    price: 98000,
    stock: 40,
    imageUrl: image('photo-1761483281579-e59f6ae3442a')
  },
  {
    name: 'Rangpur Shataranji Rug',
    description:
      'Flat-woven cotton shataranji in a geometric pattern, made on a floor loom by weavers in Rangpur. The rug measures 3 x 5 feet, lies flat without a backing and can be used on either side. The cotton yarn is dyed in fast colours. Shake out dust regularly and wash by hand in cold water when needed, then dry in the shade.',
    price: 210000,
    stock: 25,
    imageUrl: image('photo-1793622186044-8100eddd75f1')
  },
  {
    name: 'Tangail Silk Scarf',
    description:
      'Lightweight half-silk scarf woven in Tangail with a traditional woven border and a soft, slightly textured hand. It measures 180 x 50 cm and drapes easily over the shoulders in warm weather. The blend of silk and cotton keeps it breathable. Dry clean or hand wash gently in cold water, and iron on low heat from the reverse side.',
    price: 115000,
    stock: 60,
    imageUrl: image('photo-1606259458027-54d2a728b6ab')
  },
  {
    name: 'Shital Pati Floor Mat',
    description:
      'Cool woven murta-cane mat from Sylhet, 5 x 7 feet, naturally dyed. Shital pati is a traditional craft in which thin strips of cane are split, soaked and woven by hand into a smooth surface that stays cool in summer. Wipe with a damp cloth and keep it away from standing water. Roll it up loosely for storage.',
    price: 165000,
    stock: 30,
    imageUrl: image('photo-1675783385707-365fe9c76dde')
  },
  {
    name: 'Jute Tote Bag',
    description:
      'Sturdy golden-jute tote with cotton handles and an inner pocket, woven from natural jute fibre by artisans in Faridpur. The bag measures about 38 x 35 cm with a 10 cm base and carries up to 8 kg of shopping. The cotton lining keeps the fibres off your belongings. Spot clean with a damp cloth and air dry in the shade.',
    price: 45000,
    stock: 120,
    imageUrl: image('photo-1787074656306-67d69f3d8576')
  },
  {
    name: 'Nakshi Kantha Cushion Cover',
    description:
      'Hand-stitched running-stitch embroidery on layered cotton, 16 x 16 inches. The motifs of birds, flowers and leaves are worked by village women in Jamalpur, and each cover takes several days to finish. It closes with a hidden zip on one side and fits a standard 16 inch insert, which is not included. Hand wash cold and dry in the shade.',
    price: 75000,
    stock: 80,
    imageUrl: image('photo-1785064038559-10e0ad8036de')
  },
  {
    name: 'Sundarban Raw Honey, 500 g',
    description:
      'Unheated khalisha honey collected by licensed mouals in the Sundarbans during the flowering season, then strained through cloth and filled into a glass jar. It has a dark amber colour and a mild smoky flavour, and it may thicken or crystallise in cool weather. Store in a cool, dry place and use a clean dry spoon. Not for infants under one year.',
    price: 65000,
    stock: 100,
    imageUrl: image('photo-1587049352851-8d4e89133924')
  },
  {
    name: 'Rajshahi Himsagar Mango, 5 kg',
    description:
      'Fibre-free Himsagar mangoes picked at the start of the season in Rajshahi orchards and packed in a ventilated box with paper lining. A 5 kg box holds around 10 to 12 fruits. They arrive firm and ripen in two to four days at room temperature. Once soft and fragrant, keep them in the refrigerator and eat within three days.',
    price: 125000,
    stock: 50,
    imageUrl: image('photo-1519096845289-95806ee03a1a')
  },
  {
    name: 'Bogura Mishti Doi, 1 kg',
    description:
      'Sweet yoghurt set in a clay pot the traditional Bogura way, made from full-cream cow milk slowly cooked with sugar and left to ferment overnight. The pot holds 1 kg and its porous clay lets extra water escape, giving a thick, creamy texture. Keep refrigerated at 4 C and eat within five days of opening.',
    price: 32000,
    stock: 70,
    imageUrl: image('photo-1571212515416-fef01fc43637')
  },
  {
    name: 'Sylhet Black Tea, 400 g',
    description:
      'Strong CTC black tea from Srimangal gardens in the Sylhet region, ideal for doodh cha. The leaves are picked, withered, crushed and dried in local tea factories, then packed in a sealed 400 g pouch. One teaspoon makes a strong cup. Store in an airtight tin away from sunlight, moisture and strong smells.',
    price: 45000,
    stock: 310,
    imageUrl: image('photo-1606163017137-888c0177b3dd')
  },
  {
    name: 'Jamdani Cotton Saree',
    description:
      'Handwoven in Narayanganj on a pit loom, with a classic paisley border and a soft cotton body. Each saree is 5.5 metres with an unstitched blouse piece. The motifs are added thread by thread during weaving, so no two pieces are identical. Hand wash separately in cold water with mild soap and iron on medium heat.',
    price: 485000,
    stock: 14,
    imageUrl: image('photo-1616986491129-3e37cb654c82')
  },
  {
    name: 'Khadi Cotton Panjabi',
    description:
      'Breathable handspun khadi with a mandarin collar and wooden buttons, hand-woven on a loom by weavers and stitched in small workshops. The panjabi falls to the knee and is cut in a relaxed fit, with side slits and one chest pocket. The cotton softens with every wash. Wash separately in cold water and dry in the shade.',
    price: 245000,
    stock: 27,
    imageUrl: image('photo-1770359993283-a2c2f386584e')
  },
  {
    name: 'Nakshi Kantha Quilt, Queen Size',
    description:
      'Quilt made from several layers of recycled cotton cloth joined with fine running stitches by women stitchers in Rajshahi. The top carries a hand-printed pattern in rust and cream. It measures 230 x 200 cm and is light enough for the cool months in Bangladesh. Machine wash gently in cold water, then dry flat in the shade.',
    price: 580000,
    stock: 9,
    imageUrl: image('photo-1789841418137-2700299e46be')
  },
  {
    name: 'Cotton Gamchha Towel, Set of 3',
    description:
      'Three thin handloom gamchha towels in checked cotton, each 70 x 140 cm, made in Tangail. The open weave absorbs water quickly and dries within an hour in the sun, which makes it useful for bathing, travel and the kitchen. The colours soften with washing. Wash separately for the first two washes.',
    price: 85000,
    stock: 150,
    imageUrl: image('photo-1639298109207-5a9ccc254481')
  },
  {
    name: 'Block-Print Cotton Fabric, 2 m',
    description:
      'Two metres of cotton fabric printed by hand with wooden blocks in a paisley pattern, 112 cm wide. The dyes are applied one colour at a time, so small variations in the print are normal. The cloth is medium weight and suits kurtas, cushion covers and curtains. Pre-wash in cold water before cutting and sewing.',
    price: 64000,
    stock: 90,
    imageUrl: image('photo-1783763624907-b9974ce1dbe3')
  },
  {
    name: 'Block-Print Cotton Table Runner, 180 cm',
    description:
      'Table runner of 180 x 35 cm cotton printed with small red flowers on a natural beige ground, hemmed on all sides. The print is made with carved wooden blocks and fixed with a steam setting, so the colour holds in the wash. It fits a table for six people. Machine wash cold and iron while slightly damp.',
    price: 48000,
    stock: 65,
    imageUrl: image('photo-1783763625102-866d02c4dfb4')
  },
  {
    name: 'Macrame Wall Hanging, 60 cm',
    description:
      'Wall hanging knotted by hand from unbleached cotton cord and hung on a wooden dowel. It measures about 60 cm in length and 35 cm in width, and a single hook is enough to hang it. Made by a small women-led workshop in Dhaka. Dust it with a soft brush and keep it away from damp walls.',
    price: 125000,
    stock: 3,
    imageUrl: image('photo-1633594308237-3dcfa56b4e69')
  },
  {
    name: 'Bamboo Pendant Lamp Shade, 40 cm',
    description:
      'Round lamp shade woven from split bamboo by craftspeople in Sylhet, 40 cm across. It gives a soft, patterned light and hangs from a cable with a standard E27 holder. The cable and bulb are not included. Use an LED bulb of up to 9 W, since bamboo should not touch a hot filament. Dust with a dry cloth.',
    price: 140000,
    stock: 22,
    imageUrl: image('photo-1643509877015-c90830bb8519')
  },
  {
    name: 'Braided Jute Round Rug, 120 cm',
    description:
      'Round rug braided and stitched from natural jute rope, 120 cm across, produced in Faridpur. The surface is firm and slightly rough, which suits hallways, living rooms and under a dining table. It is made from a renewable fibre and has no latex backing. Vacuum regularly and spot clean with a damp cloth, as soaking will weaken the jute.',
    price: 260000,
    stock: 18,
    imageUrl: image('photo-1766405831946-2b7f1653ed8f')
  },
  {
    name: 'Terracotta Planter Set, 3 Pieces',
    description:
      'Set of three unglazed terracotta planters in graduated sizes of 12, 15 and 18 cm, made from river clay in Savar. Each pot has a drainage hole and a matching saucer. The porous clay lets roots breathe and dries out faster than plastic, so water less often. Soak new pots for an hour before the first planting.',
    price: 78000,
    stock: 55,
    imageUrl: image('photo-1468531390554-9f62f9767a87')
  },
  {
    name: 'Terracotta Flower Vase, Set of 3',
    description:
      'Three hand-thrown terracotta vases of different shapes, between 14 and 22 cm tall, finished with a plain matte surface. They are fired once and are not glazed, so keep water in the vase to a minimum or use them with dried stems. They look best grouped together on a shelf or a window sill. Wipe with a dry cloth.',
    price: 92000,
    stock: 35,
    imageUrl: image('photo-1510828561531-05a3388f6d3d')
  },
  {
    name: 'Handmade Ceramic Bowls, Set of 4',
    description:
      'Four small ceramic bowls, each 12 cm wide and 6 cm deep, shaped by hand and finished with a glossy glaze in assorted colours. They suit rice, soup, curd or sauces. Slight differences in shape and colour show that each piece was made by hand. The glaze is food-safe and the bowls are dishwasher safe, but avoid sudden changes in temperature.',
    price: 72000,
    stock: 48,
    imageUrl: image('photo-1762922425155-d03e6997e33e')
  },
  {
    name: 'Black Clay Rice Bowl, 600 ml',
    description:
      'Deep bowl shaped from local clay and fired in a smoky kiln, which turns the surface dark grey to black. It holds 600 ml and works for rice, dal or soup. The inside has a smooth burnished finish. Wash by hand with warm water and dry well, and do not use it in a microwave or on a direct flame.',
    price: 38000,
    stock: 85,
    imageUrl: image('photo-1609054691436-fc8d64bf9a62')
  },
  {
    name: 'Hand-Painted Blue and White Bowl, 450 ml',
    description:
      'Ceramic bowl of 450 ml with a hand-painted blue pattern on a white glaze, made in a small studio in Dhaka. It is suited to cereal, salad and noodles. The painting is done with a brush, so the lines vary slightly from bowl to bowl. It can go in a dishwasher and microwave, but hand washing will keep the pattern bright for longer.',
    price: 42000,
    stock: 70,
    imageUrl: image('photo-1657395330801-2214c0d02e41')
  },
  {
    name: 'Carved Brass Water Pot, 2 L',
    description:
      'Traditional kalosh-style water pot cast in brass in Dhamrai and engraved by hand with a floral pattern. It holds 2 litres and weighs about 1.1 kg. Water stored in brass is a long-standing habit in Bengali homes. The metal darkens with time; clean it with tamarind or lemon and salt, then rinse and dry fully.',
    price: 380000,
    stock: 6,
    imageUrl: image('photo-1766399654235-a6793895422d')
  },
  {
    name: 'Brass Cookware Set, 3 Pieces',
    description:
      'Three brass pots with lids in 1, 2 and 3 litre sizes, hammered by metalworkers in Dhamrai. Brass spreads heat evenly and suits slow cooking of dal and curry, but the pots must be tinned on the inside before use for cooking. This set is supplied with a fresh tin lining. Wash by hand and dry straight away.',
    price: 1450000,
    stock: 2,
    imageUrl: image('photo-1652960018678-1f19799996c5')
  },
  {
    name: 'Brass Lidded Container Set, 3 Pieces',
    description:
      'Three lidded brass containers with engraved patterns in 8, 10 and 12 cm diameters, cast in Dhamrai. They are used to store spices, betel nut, jewellery or small keepsakes. The lids fit closely and sit flush. Polish occasionally with a soft cloth and a little lemon juice to keep the shine, or leave them to take on a darker patina.',
    price: 320000,
    stock: 20,
    imageUrl: image('photo-1774978238263-325655a7b0b6')
  },
  {
    name: 'Hammered Copper Teapot, 1 L',
    description:
      'One litre teapot made of hand-hammered copper with a long spout and a wooden handle, formed by coppersmiths in old Dhaka. It is suited to boiling water and serving tea at the table. The inside is lined with tin for safe use. Clean with lemon and salt and dry fully after each use. Not suitable for induction cooktops.',
    price: 690000,
    stock: 0,
    imageUrl: image('photo-1793600582466-15e22c58207b')
  },
  {
    name: 'Wooden Spoon Set, 5 Pieces',
    description:
      'Five kitchen spoons carved from mango wood with a smooth oiled finish, from 25 to 32 cm long. Each piece is shaped by hand by woodworkers and sanded smooth, so the grain differs from spoon to spoon. The set includes a stirring spoon, a ladle and a slotted spoon. Wash by hand, dry at once and rub with food-safe oil now and then.',
    price: 55000,
    stock: 95,
    imageUrl: image('photo-1594761077961-cadd185540a4')
  },
  {
    name: 'Wooden Serving Bowl Set, 3 Pieces',
    description:
      'Three serving bowls turned from raintree wood in Gazipur, with diameters of 16, 20 and 24 cm. The grain is visible under a food-safe oil finish, and each bowl nests inside the next for storage. They are suited to salad, fruit and dry snacks. Wash quickly by hand and never soak them. Rub with a little coconut oil from time to time.',
    price: 135000,
    stock: 32,
    imageUrl: image('photo-1773609688714-2f6354ae4f3c')
  },
  {
    name: 'Carved Wooden Jewellery Box',
    description:
      'Jewellery box of segun teak, 22 x 14 x 9 cm, with a hinged lid and a lined interior with two trays. The lid is carved by hand with a simple leaf pattern and finished with a clear lacquer. It closes with a small brass catch. Keep it dry and wipe with a soft cloth. Made by woodworkers in Chattogram.',
    price: 185000,
    stock: 24,
    imageUrl: image('photo-1607437817193-3b3b029b5b75')
  },
  {
    name: 'Bamboo Jewellery Tray Organiser',
    description:
      'Stackable set of two bamboo trays with fixed dividers for rings, earrings, bracelets and necklaces. Each tray measures 28 x 20 x 4 cm. The bamboo is treated and sealed, so it is smooth to the touch and free of splinters. It fits in a standard drawer or on a dresser. Wipe clean with a dry or lightly damp cloth.',
    price: 98000,
    stock: 44,
    imageUrl: image('photo-1786396798342-901bc98d7eb6')
  },
  {
    name: 'Silver Tree of Life Pendant',
    description:
      'Pendant in 92.5 sterling silver showing a tree of life motif, 3 cm across, hand finished by silversmiths in Dhaka and supplied on a 45 cm silver chain. It arrives in a cloth pouch. Store it away from moisture and perfume. Polish with a soft silver cloth when it dulls and keep it dry when bathing or swimming.',
    price: 420000,
    stock: 4,
    imageUrl: image('photo-1636103952204-0b738c225264')
  },
  {
    name: 'Oxidised Silver Bead Necklace',
    description:
      'Necklace of oxidised silver-plated beads strung on a cotton cord that ties at the back, so the length can be changed between 40 and 55 cm. The beads are cast in small workshops in Dhaka, and the dark finish brings out the engraved detail. Keep it dry, and store it in the pouch it comes in to slow tarnishing.',
    price: 145000,
    stock: 5,
    imageUrl: image('photo-1625627796701-e3c0911b89f3')
  },
  {
    name: 'Brass Hoop Earrings',
    description:
      'Pair of twisted hoop earrings in brass with a polished finish, 4 cm across and light enough to wear all day. The posts are nickel free. They are made by metalworkers in Dhamrai from recycled brass. Brass can darken with contact with perfume and sweat; wipe with a soft dry cloth after wear and keep the pair in a small bag.',
    price: 52000,
    stock: 130,
    imageUrl: image('photo-1617038220319-276d3cfab638')
  },
  {
    name: 'Shell Drop Earrings',
    description:
      'Light drop earrings made from cut conch shell, a material used in Bengali bangles for centuries, with brass hooks. Each earring is 5 cm long and weighs under 4 g. The shell is polished by hand in Dhaka, so patterns differ slightly from one pair to the next. Keep them away from water and perfume, and store them flat.',
    price: 38000,
    stock: 75,
    imageUrl: image('photo-1778182553300-7593326ca29d')
  },
  {
    name: 'Leather Bifold Wallet',
    description:
      'Bifold wallet in full-grain cow leather, cut and stitched in Hazaribagh, Dhaka. It has six card slots, two note compartments and a small coin pocket, and it measures 11 x 9 cm when closed. The leather is vegetable-tanned and will darken with use. Wipe with a dry cloth and avoid prolonged contact with water.',
    price: 125000,
    stock: 100,
    imageUrl: image('photo-1624538000860-24716b9050f2')
  },
  {
    name: 'Leather Sling Bag',
    description:
      'Sling bag of tan cow leather with an adjustable strap and a flap closure with a metal buckle. It measures 24 x 18 x 7 cm and holds a phone, wallet, keys and a small tablet. Inside there is a zip pocket and a slip pocket. Made in Dhaka. Condition the leather with a little leather balm twice a year and keep it out of direct sun.',
    price: 280000,
    stock: 28,
    imageUrl: image('photo-1600857062241-98e5dba7f214')
  },
  {
    name: 'Leather Tote Bag',
    description:
      'Unlined tote bag in soft cow leather, 38 x 30 x 12 cm, with two shoulder handles and a magnetic closure at the top. It takes a 13 inch laptop and a notebook. The leather is dyed through, so scratches blend in with time. Stitching is done by hand in Dhaka. Stuff it lightly with paper when storing to keep its shape.',
    price: 420000,
    stock: 16,
    imageUrl: image('photo-1760624294582-5341f33f9fa4')
  },
  {
    name: 'Leather Satchel',
    description:
      'Satchel in grey cow leather with two buckled flaps, brass hardware and a padded inside pocket for a laptop up to 14 inches. It measures 38 x 28 x 10 cm with a removable strap that can be shortened. Hand stitched in Dhaka. Wipe with a damp cloth and use a leather conditioner when it begins to look dry.',
    price: 690000,
    stock: 0,
    imageUrl: image('photo-1473188588951-666fce8e7c68')
  },
  {
    name: 'Cane Storage Basket Set, 3 Pieces',
    description:
      'Three storage baskets woven from cane, in 25, 30 and 35 cm diameters, made by weavers in Sylhet. The round shape and handles make them useful for laundry, toys, fruit or magazines. Cane is light and strong but not waterproof, so keep the baskets away from wet floors. Brush off dust and dry in the shade if they get damp.',
    price: 145000,
    stock: 40,
    imageUrl: image('photo-1455669175216-9017c9b02fc6')
  },
  {
    name: 'Hand-Woven Bamboo Basket, Large',
    description:
      'Large bamboo basket with a tight weave and a sturdy rim, 40 cm wide and 30 cm tall, made by rural artisans in Sylhet from locally grown bamboo. It is suited to firewood, towels, plants or shopping. The bamboo is dried and treated against insects. Dust with a dry brush and avoid leaving it in standing water.',
    price: 98000,
    stock: 36,
    imageUrl: image('photo-1543251796-6c716ef2187b')
  },
  {
    name: 'Jeera Cumin Seeds, 250 g',
    description:
      'Whole cumin seeds, cleaned and sun-dried, packed in a glass jar that holds 250 g. The seeds are sorted by hand to remove stalks and grit, and keep their warm, earthy aroma. Toast lightly in a dry pan before grinding for the best flavour in curries and rice. Keep the jar tightly closed in a cool, dry cupboard.',
    price: 22000,
    stock: 180,
    imageUrl: image('photo-1701189975842-591ebd1e26a2')
  },
  {
    name: 'Red Chilli Powder, 250 g',
    description:
      'Stone-ground red chilli powder with a medium heat and a deep colour, made from sun-dried whole chillies ground slowly in a stone mill so the oils are not burnt. The 250 g pack has no added colour or filler. Use a little at a time in curries, pickles and marinades. Store in an airtight jar away from heat and damp.',
    price: 18000,
    stock: 220,
    imageUrl: image('photo-1547332226-395d746d139a')
  },
  {
    name: 'Cold-Pressed Mustard Oil, 500 ml',
    description:
      'Pungent mustard oil pressed from local black mustard seed in Pabna, using a traditional wooden ghani press without added heat. The 500 ml bottle is unrefined and has the sharp aroma used in bhorta, fish curries and pickles. Heat it to smoking point before cooking to mellow the taste. Store tightly capped away from sunlight.',
    price: 24000,
    stock: 160,
    imageUrl: image('photo-1474979266404-7eaacbcd87c5')
  },
  {
    name: 'Khejur Gur Date Palm Jaggery, 500 g',
    description:
      'Winter date palm jaggery from Jessore, made by boiling fresh sap collected from the trees in the early morning. It has a soft, fudge-like texture and a smoky caramel taste, and it is used for pithas, payesh and tea. The pack holds about 500 g in a food-grade tub. Keep it in a cool place in a sealed container and use it within three months.',
    price: 32000,
    stock: 0,
    imageUrl: image('photo-1788238025855-55581a2ed354')
  },
  {
    name: 'Mixed Vegetable Achar, 400 g',
    description:
      'Mixed pickle of carrot, green chilli, lemon and cauliflower prepared in mustard oil with panch phoron and turmeric, in a 400 g glass jar. It is made in small batches in Chattogram with no added colour or preservatives apart from salt and oil. It tastes best with rice, paratha or khichuri. Keep the jar closed and refrigerate once opened.',
    price: 28000,
    stock: 110,
    imageUrl: image('photo-1757782565345-7b774ae71ab7')
  },
  {
    name: 'Srimangal Green Tea, 100 g',
    description:
      'Whole-leaf green tea grown and pan-fired in the tea gardens of Srimangal, Moulvibazar. The leaves are rolled lightly and dried without added flavour, giving a pale green cup with a fresh, grassy taste. Use one teaspoon per cup with water at 80 degrees Celsius and steep for two minutes. Store in a dry, airtight container away from light.',
    price: 32000,
    stock: 140,
    imageUrl: image('photo-1763617702099-d956f3fd8324')
  },
  {
    name: 'Srimangal Orthodox Black Tea, 250 g',
    description:
      'Orthodox leaf black tea from estates around Srimangal, Moulvibazar, with whole, twisted leaves and a bright copper cup. The taste is malty and lightly floral, so it is good without milk. Use one teaspoon per cup with freshly boiled water and steep for three to four minutes. Store in a tin or a sealed bag away from damp and strong smells.',
    price: 48000,
    stock: 120,
    imageUrl: image('photo-1760074057726-53a88633cf67')
  },
  {
    name: 'Kalijira Aromatic Rice, 2 kg',
    description:
      'Small-grain aromatic rice known as kalijira or Bangladeshi baby basmati, grown in Dinajpur and sold unpolished at the edges so the grain keeps its scent. A 2 kg bag is enough for about 20 servings. It cooks in 15 minutes and goes well with polao, khichuri and biryani. Rinse twice before cooking and keep the pack sealed and dry.',
    price: 42000,
    stock: 8,
    imageUrl: image('photo-1586201375761-83865001e31c')
  }
];
