"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import Papa from "papaparse";

interface MortalityData {
  year: string;
  respiratory: number;
  cardiovascular: number;
  male: number;
  female: number;
}

interface RespiratorySubgroup {
  name: string;
  value: number;
}

interface MorbidityData {
  year: string;
  respiratoryCases: number;
  cardiovascularCases: number;
  respiratorySubgroups: RespiratorySubgroup[];
  J00_J06: number;
  J09_J18: number;
  J20_J22: number;
  J30_J39: number;
  J40_J47: number;
  J60_J70: number;
  J80_J84: number;
  J85_J86: number;
}

const YEARS = [
  "2005",
  "2006",
  "2007",
  "2008",
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
];

// Add interfaces for CSV data types
interface MortalityRow {
  ID: string;
  GRUPO_CAUSA667: string;
  SUBGRUPO_CAUSA667: string;
  SEXO: string;
  [key: string]: string; // for year columns
}

interface MorbidityRow {
  "Subgrupo de Causa": string;
  [key: string]: string; // for year columns
}

// Update MorbidityData interface to allow number values for respiratory subgroup codes
interface MorbidityData {
  year: string;
  respiratoryCases: number;
  cardiovascularCases: number;
  respiratorySubgroups: RespiratorySubgroup[];
  [key: string]: string | number | RespiratorySubgroup[]; // Allow dynamic properties
}

export default function Home() {
  const [data, setData] = useState<MortalityData[]>([]);
  const [morbidityData, setMorbidityData] = useState<MorbidityData[]>([]);
  const [selectedYear, setSelectedYear] = useState("2022");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load mortality data
        const mortalityResponse = await fetch("/data/mortality_data.csv");
        const mortalityCsvText = await mortalityResponse.text();

        // Load morbidity data
        const morbidityResponse = await fetch("/data/morbility_data.csv");
        const morbidityCsvText = await morbidityResponse.text();

        // Process mortality data
        Papa.parse(mortalityCsvText, {
          header: true,
          complete: (results) => {
            const processedData: MortalityData[] = YEARS.map((year) => ({
              year,
              respiratory: 0,
              cardiovascular: 0,
              male: 0,
              female: 0,
            }));

            (results.data as MortalityRow[]).forEach((row) => {
              if (!row.ID) return;

              YEARS.forEach((year) => {
                const yearIndex = YEARS.indexOf(year);
                if (
                  row.GRUPO_CAUSA667 === "100 - ENFERMEDADES TRANSMISIBLES" &&
                  row.SUBGRUPO_CAUSA667 ===
                    "108 - INFECCIONES RESPIRATORIAS AGUDAS"
                ) {
                  if (row.SEXO === "MASCULINO") {
                    processedData[yearIndex].male = parseFloat(row[year]) || 0;
                  }
                  if (row.SEXO === "FEMENINO") {
                    processedData[yearIndex].female =
                      parseFloat(row[year]) || 0;
                  }
                  if (row.SEXO === "TOTAL") {
                    processedData[yearIndex].respiratory =
                      parseFloat(row[year]) || 0;
                  }
                } else if (
                  row.GRUPO_CAUSA667 ===
                    "300 - ENFERMEDADES SISTEMA CIRCULATORIO" &&
                  row.SUBGRUPO_CAUSA667 ===
                    "303 - ENFERMEDADES ISQUÉMICAS DEL CORAZÓN" &&
                  row.SEXO === "TOTAL"
                ) {
                  processedData[yearIndex].cardiovascular =
                    parseFloat(row[year]) || 0;
                }
              });
            });

            setData(processedData);
          },
        });

        // Process morbidity data
        Papa.parse(morbidityCsvText, {
          header: true,
          complete: (results) => {
            const processedMorbidityData: MorbidityData[] = YEARS.map(
              (year) => ({
                year,
                respiratoryCases: 0,
                cardiovascularCases: 0,
                respiratorySubgroups: [],
                J00_J06: 0,
                J09_J18: 0,
                J20_J22: 0,
                J30_J39: 0,
                J40_J47: 0,
                J60_J70: 0,
                J80_J84: 0,
                J85_J86: 0,
              })
            );

            (results.data as MorbidityRow[]).forEach((row) => {
              const subgroupMatch =
                row["Subgrupo de Causa"]?.match(/(J\d+-J\d+)/);
              if (subgroupMatch) {
                const code = subgroupMatch[1];
                const propertyName = code.replace("-", "_");

                [
                  "2015",
                  "2016",
                  "2017",
                  "2018",
                  "2019",
                  "2020",
                  "2021",
                  "2022",
                ].forEach((year) => {
                  const yearIndex = YEARS.indexOf(year);
                  if (yearIndex !== -1) {
                    const value =
                      parseFloat(row[year]?.toString().replace(",", ".")) || 0;
                    if (!isNaN(value)) {
                      processedMorbidityData[yearIndex][propertyName] = value;
                    }
                  }
                });
              }
            });

            setMorbidityData(processedMorbidityData);
          },
        });
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  const yearData = data.find((d) => d.year === selectedYear) || {
    year: selectedYear,
    male: 0,
    female: 0,
    respiratory: 0,
    cardiovascular: 0,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">
            Tendencias de Mortalidad (2005-2022)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="respiratory"
                stroke="#8884d8"
                name="Respiratorias"
              />
              <Line
                type="monotone"
                dataKey="cardiovascular"
                stroke="#82ca9d"
                name="Cardiovasculares"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">
            Mortalidad por Género ({selectedYear})
          </h2>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>{selectedYear}</SelectTrigger>
            <SelectContent>
              {YEARS.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[yearData]}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="male" fill="#3F448C" name="Hombres" />
              <Bar dataKey="female" fill="#FFA07A" name="Mujeres" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">
            Casos de Morbilidad por Tipo de Enfermedad Respiratoria
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={morbidityData.filter((d) => parseInt(d.year) >= 2015)}
            >
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{ paddingLeft: "20px" }}
              />
              <Bar
                dataKey="J00_J06"
                stackId="a"
                fill="#8884d8"
                name="Inf. agudas vías resp. sup."
              />
              <Bar
                dataKey="J09_J18"
                stackId="a"
                fill="#82ca9d"
                name="Influenza y neumonía"
              />
              <Bar
                dataKey="J20_J22"
                stackId="a"
                fill="#ffc658"
                name="Otras inf. agudas vías resp. inf."
              />
              <Bar
                dataKey="J30_J39"
                stackId="a"
                fill="#ff7300"
                name="Otras enf. vías resp. sup."
              />
              <Bar
                dataKey="J40_J47"
                stackId="a"
                fill="#00c49f"
                name="Enf. crónicas vías resp. inf."
              />
              <Bar
                dataKey="J60_J70"
                stackId="a"
                fill="#ff6361"
                name="Enf. pulmón agentes externos"
              />
              <Bar
                dataKey="J80_J84"
                stackId="a"
                fill="#58508d"
                name="Otras enf. respiratorias intersticiales"
              />
              <Bar
                dataKey="J85_J86"
                stackId="a"
                fill="#bc5090"
                name="Afecciones supurativas"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
