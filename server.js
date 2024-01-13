const http = require("http");
const qs = require("querystring");
const fs = require("fs/promises");

const port = 8000;

// Constants
const views = {
  home: "./views/home.html",
  addCat: "./views/addCat.html",
  addBreed: "./views/addBreed.html",
  editCat: "./views/editCat.html",
  shelterCat: "./views/catShelter.html",
};

const templates = {
  cat: "./views/catTemplate.html",
};

const styles = {
  site: "./views/styles/site.css",
};

const fileEncodings = {
  encoding: "utf-8",
};

// Work Data

let breeds = [
  "Bombay Cat",
  "American Bobtail Cat",
  "Bengal Cat",
  "British Shorthair Cat",
  "Unknown",
];

let cats = [
  {
    id: 1,
    name: "Pretty Cat",
    breed: "Bombay Cat",
    description:
      "Dominant and aggressive to other cats. Will probably eat you in your sleep. Very cute tho.",
    imageUrl:
      "https://ichef.bbci.co.uk/news/976/cpsprodpb/12A9B/production/_111434467_gettyimages-1143489763.jpg",
  },
  {
    id: 2,
    name: "Pretty Kitty",
    breed: "American Bobtail Cat",
    description: "Chilled pretty cat of course.",
    imageUrl:
      "https://cdn.pixabay.com/photo/2015/06/19/14/20/cat-814952_1280.jpg",
  },
];

// CRUD functions

/* const catHandlers = {
  addCat: (data) => {},
  addBreed: (breed) => {
    breeds.push(breed);
  },
  editCat: (id, data) => {},
  removeCat: (id) => {},
}; */

const server = http.createServer(async (req, res) => {
  if (req.url === "/") {
    let homePage = await fs.readFile(views.home, fileEncodings);

    const catsTemplate = await generateCatsTemplate(cats);
    homePage = homePage.replace("{cats}", catsTemplate.join(""));

    res.writeHead(200, {
      "Content-Type": "text/html",
    });

    res.write(homePage);
    res.end();
  } else if (req.url === "/cats/add-cat" && req.method === "GET") {
    let addCatPage = await fs.readFile(views.addCat, fileEncodings);

    const breedsTemplate = generateBreedsTemplate();

    addCatPage = addCatPage.replace("{breeds}", breedsTemplate.join(""));

    res.setHeader("Content-Type", "text/html");
    res.write(addCatPage);
    res.end();
  } else if (req.url === "/cats/add-breed" && req.method === "GET") {
    const addBreedPage = await fs.readFile(views.addBreed, fileEncodings);
    res.setHeader("Content-Type", "text/html");
    res.write(addBreedPage);
    res.end();
  } else if (req.url.startsWith("/cats/edit-cat") && req.method === "GET") {
    let editCatPage = await fs.readFile(views.editCat, fileEncodings);

    // Add breeds to the select input
    const breedsTemplate = generateBreedsTemplate();

    editCatPage = editCatPage.replace("{breeds}", breedsTemplate.join(""));

    // Append cat information to the input fields.
    const catId = +req.url.split("?")[1].split("=")[1];
    console.log(catId);

    let modifiedEditCatPage = appendCatInformation(catId, editCatPage, true);

    res.setHeader("Content-Type", "text/html");
    res.write(modifiedEditCatPage);
    res.end();
  } else if (req.url.startsWith("/cats/shelter") && req.method === "GET") {
    const shelterCatPage = await fs.readFile(views.shelterCat, fileEncodings);

    const catId = +req.url.split("?")[1].split("=")[1];

    let modifiedEditCatPage = appendCatInformation(
      catId,
      shelterCatPage,
      false
    );

    res.setHeader("Content-Type", "text/html");
    res.write(modifiedEditCatPage);
    res.end();
  } else if (req.url === "/cats/add-cat" && req.method === "POST") {
    // Functionalitty requests
    let body = "";

    req.on("data", (data) => {
      body += data;
    });

    req.on("close", () => {
      let postData = qs.parse(body);
      console.log(postData);
      postData["id"] = cats[cats.length - 1].id + 1;

      console.log(postData);
      cats.push(postData);

      res.writeHead(302, {
        location: "/",
      });
      res.end();
    });
  } else if (req.url.startsWith("/cats/edit-cat") && req.method === "POST") {
    let body = "";

    req.on("data", (data) => {
      body += data;
    });

    req.on("close", () => {
      let editData = qs.parse(body);
      const catId = +req.url.split("?")[1].split("=")[1];

      editData["id"] = catId;
      console.log(editData);
      cats = cats.map((cat) => (cat.id === catId ? editData : cat));

      res.writeHead(302, {
        location: "/",
      });
      res.end();
    });
  } else if (req.url.startsWith("/cats/shelter") && req.method === "POST") {
    const catId = +req.url.split("?")[1].split("=")[1];

    cats = cats.filter((cat) => cat.id !== catId);

    res.writeHead(302, {
      location: "/",
    });
    res.end();
  } else if (req.url === "/content/styles/site.css") {
    // CSS
    const siteCss = await fs.readFile(styles.site, fileEncodings);
    res.writeHead(200, {
      "Content-Type": "text/css",
    });
    res.write(siteCss);
    res.end();
  } else {
    res.write("<h1>404 Not Found</h1>");
    res.end();
  }
});

const generateCatsTemplate = async (cats) => {
  let catTemplate = await fs.readFile(templates.cat, fileEncodings);
  const fieldPattern = new RegExp(/{\w+}/g);
  let catsResultTemplate = [];

  let rawFieldMatches = catTemplate.match(fieldPattern);
  let fieldMatches = rawFieldMatches.map((el) => el.replace(/[{}]/g, ""));

  cats.forEach((cat) => {
    let currentCatTemplate = catTemplate;
    for (let i = 0; i < rawFieldMatches.length; i++) {
      currentCatTemplate = currentCatTemplate.replace(
        rawFieldMatches[i],
        cat[fieldMatches[i]]
      );
    }
    catsResultTemplate.push(currentCatTemplate);
  });

  return catsResultTemplate;
};

const generateBreedsTemplate = () => {
  let breedsResultTemplate = [];

  breeds.forEach((breed) => {
    let currentBreedTemplate = `<option value="${breed}">${breed}</option>`;
    breedsResultTemplate.push(currentBreedTemplate);
  });

  return breedsResultTemplate;
};

const appendCatInformation = (id, catPage, isSelect) => {
  const selectedCat = cats.find((cat) => cat.id === id);
  console.log(selectedCat);
  let selectedCatFields = Object.keys(selectedCat);

  for (let i = 0; i < selectedCatFields.length; i++) {
    console.log(selectedCatFields[i]);
    /* if (selectedCatFields[i] === "id") {
            continue;
        } */

    if (selectedCatFields[i] === "breed") {
      if (isSelect) {
        let breed = selectedCat[selectedCatFields[i]];
        catPage = catPage.replace(
          `<option value="${breed}">${breed}</option>`,
          `<option value="${breed}" selected>${breed}</option>`
        );
      } else {
        let breed = selectedCat[selectedCatFields[i]];
        catPage = catPage.replace(
          "{breed}",
          `<option value="${breed}">${breed}</option>`
        );
      }
      continue;
    }

    catPage = catPage.replace(
      `{${selectedCatFields[i]}}`,
      selectedCat[selectedCatFields[i]]
    );
  }

  return catPage;
};

server.listen(port);
console.log(`Server is listening on port ${port} - http://localhost:${port}`);
