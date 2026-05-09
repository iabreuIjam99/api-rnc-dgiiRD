import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route for RNC Validation
  app.get("/api/validate-rnc/:rnc", async (req, res) => {
    const { rnc } = req.params;

    if (!rnc || (rnc.length !== 9 && rnc.length !== 11)) {
      return res.status(400).json({ error: "RNC inválido. Debe tener 9 u 11 dígitos." });
    }

    try {
      // DGII URL
      const url = "https://dgii.gov.do/app/WebApps/ConsultasWeb2/ConsultasWeb/consultas/rnc.aspx";
      
      // We need to get the page first to extract ASP.NET hidden fields
      const getResponse = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const $ = cheerio.load(getResponse.data);
      const viewState = $("#__VIEWSTATE").val();
      const eventValidation = $("#__EVENTVALIDATION").val();
      const viewStateGenerator = $("#__VIEWSTATEGENERATOR").val();

      // Perform POST request to search
      const formData = new URLSearchParams();
      formData.append("__VIEWSTATE", viewState as string);
      formData.append("__EVENTVALIDATION", eventValidation as string);
      formData.append("__VIEWSTATEGENERATOR", viewStateGenerator as string);
      formData.append("ctl00$cphMain$txtRncCedula", rnc);
      formData.append("ctl00$cphMain$btnBuscar", "Buscar");

      const postResponse = await axios.post(url, formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": url
        }
      });

      const $result = cheerio.load(postResponse.data);
      
      // Check if the result table exists
      const table = $result("#cphMain_dvDatosContrayentes");
      
      if (table.length === 0) {
        return res.status(404).json({ exists: false, error: "RNC no encontrado." });
      }

      // Extract data
      const name = $result("#ctl00_cphMain_dvDatosContrayentes td:contains('Nombre / Razón Social')").next().text().trim();
      const commercialName = $result("#ctl00_cphMain_dvDatosContrayentes td:contains('Nombre Comercial')").next().text().trim();
      const status = $result("#ctl00_cphMain_dvDatosContrayentes td:contains('Estado')").next().text().trim();
      const type = $result("#ctl00_cphMain_dvDatosContrayentes td:contains('Categoría')").next().text().trim();
      const activity = $result("#ctl00_cphMain_dvDatosContrayentes td:contains('Actividad Económica')").next().text().trim();
      const adminDate = $result("#ctl00_cphMain_dvDatosContrayentes td:contains('Fecha de Administración')").next().text().trim();
      const rncDisplay = $result("#ctl00_cphMain_dvDatosContrayentes td:contains('RNC / Cédula')").next().text().trim();

      return res.json({
        exists: true,
        data: {
          rnc: rncDisplay,
          name,
          commercialName,
          status,
          type,
          activity,
          adminDate
        }
      });

    } catch (error: any) {
      console.error("Error validating RNC:", error.message);
      return res.status(500).json({ error: "Error al conectar con la DGII. Intente más tarde." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
