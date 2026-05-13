import "server-only";

export type SecTickerRecord = {
  cik_str: number;
  ticker: string;
  title: string;
};

export type SecResolvedCompany = {
  ticker: string;
  cik: string;
  name: string;
};

export type SecTickerResolution =
  | SecResolvedCompany
  | {
      ticker: string;
      error: string;
    };

export type SecFiling = {
  accessionNumber: string;
  filingType: string;
  filingDate: string;
  reportDate: string | null;
  primaryDocument: string;
  secUrl: string;
  primaryDocumentUrl: string;
};

type CompanySubmissions = {
  filings: {
    recent: {
      accessionNumber: string[];
      form: string[];
      filingDate: string[];
      reportDate: string[];
      primaryDocument: string[];
    };
  };
};

const SEC_TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const SEC_ARCHIVE_BASE = "https://www.sec.gov/Archives/edgar/data";

function getSecHeaders(host = "www.sec.gov") {
  const userAgent = process.env.SEC_USER_AGENT;
  if (!userAgent) {
    throw new Error("Missing required environment variable: SEC_USER_AGENT");
  }

  return {
    "User-Agent": userAgent,
    "Accept-Encoding": "gzip, deflate",
    Host: host,
  };
}

function padCik(cik: number | string) {
  return String(cik).padStart(10, "0");
}

function compactAccession(accessionNumber: string) {
  return accessionNumber.replaceAll("-", "");
}

export async function resolveTickers(
  tickers: string[],
): Promise<SecTickerResolution[]> {
  const response = await fetch(SEC_TICKERS_URL, {
    headers: getSecHeaders(),
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`SEC ticker mapping failed: ${response.status}`);
  }

  const mapping = (await response.json()) as Record<string, SecTickerRecord>;
  const records = Object.values(mapping);
  const byTicker = new Map(
    records.map((record) => [record.ticker.toUpperCase(), record]),
  );

  return tickers.map((ticker) => {
    const record = byTicker.get(ticker.toUpperCase());
    if (!record) {
      return {
        ticker: ticker.toUpperCase(),
        error: `Ticker ${ticker.toUpperCase()} was not found in SEC mapping.`,
      };
    }

    return {
      ticker: record.ticker.toUpperCase(),
      cik: padCik(record.cik_str),
      name: record.title,
    };
  });
}

export async function fetchRecent8Ks(company: SecResolvedCompany, limit = 5) {
  const response = await fetch(
    `https://data.sec.gov/submissions/CIK${company.cik}.json`,
    {
      headers: getSecHeaders("data.sec.gov"),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `SEC submissions fetch failed for ${company.ticker}: ${response.status}`,
    );
  }

  const data = (await response.json()) as CompanySubmissions;
  const recent = data.filings.recent;
  const filings: SecFiling[] = [];

  for (let index = 0; index < recent.accessionNumber.length; index += 1) {
    if (recent.form[index] !== "8-K") continue;

    const accessionNumber = recent.accessionNumber[index];
    const accessionNoDashes = compactAccession(accessionNumber);
    const cikNoLeadingZeros = String(Number(company.cik));
    const filingFolder = `${SEC_ARCHIVE_BASE}/${cikNoLeadingZeros}/${accessionNoDashes}`;
    const primaryDocument = recent.primaryDocument[index];

    filings.push({
      accessionNumber,
      filingType: recent.form[index],
      filingDate: recent.filingDate[index],
      reportDate: recent.reportDate[index] || null,
      primaryDocument,
      secUrl: `${filingFolder}/${accessionNumber}-index.htm`,
      primaryDocumentUrl: `${filingFolder}/${primaryDocument}`,
    });

    if (filings.length >= limit) break;
  }

  return filings;
}

export async function fetchFilingText(filing: SecFiling) {
  const response = await fetch(filing.primaryDocumentUrl, {
    headers: getSecHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `SEC filing document fetch failed for ${filing.accessionNumber}: ${response.status}`,
    );
  }

  return response.text();
}
