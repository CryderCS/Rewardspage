const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';  // Dein API-Schlüssel
const spreadsheetId = '1R9R6QH6A_mrwbR2RnpaOTSnjLKOzaMiPaVXiHxU_Z70';  // Dein Spreadsheet-ID (ersetze dies)
const range = 'Sheet1!A1:G10';  // Bereich in deinem Google Sheet (z.B. A1:G10 für die ersten 10 Zeilen und 7 Spalten)

// Google API initialisieren
function initApi() {
    gapi.client.init({
        'apiKey': apiKey,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(() => {
        // Google Sheets API aufrufen
        getSheetData();
    });
}

// Laden der Google Sheets-Daten
function getSheetData() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    }).then((response) => {
        const data = response.result.values;
        if (data.length > 0) {
            // Die erste Zeile als Überschrift verwenden
            const headers = data[0];  // Erste Zeile (Index 0) wird als Überschrift genommen

            // Nur die Spalten C (2), D (3), F (5) und G (6) extrahieren, ab der zweiten Zeile
            const filteredData = data.slice(1).map(row => [
                row[2],  // Spalte C
                row[3],  // Spalte D
                formatNumber(row[5]),  // Spalte F mit Formatierung
                row[6]   // Spalte G
            ]);

            // Spaltenüberschriften in die Tabelle einfügen
            displayHeaders(headers);
            
            // Gefilterte Daten in die Tabelle einfügen
            displayDataInTable(filteredData);
        } else {
            console.log('Keine Daten gefunden.');
        }
    }, (error) => {
        console.error('Fehler beim Abrufen der Daten:', error);
    });
}

// Spaltenüberschriften in die HTML-Tabelle einfügen
function displayHeaders(headers) {
    const tableHead = document.querySelector('#sheet-table thead');
    tableHead.innerHTML = ''; // Vorherige Überschriften löschen

    const tr = document.createElement('tr');
    headers.forEach((header, index) => {
        // Wir filtern nur die Spalten C, D, F und G
        if (index === 2 || index === 3 || index === 5 || index === 6) {
            const th = document.createElement('th');
            th.textContent = header;
            tr.appendChild(th);
        }
    });
    tableHead.appendChild(tr);
}

// Daten in die HTML-Tabelle einfügen
function displayDataInTable(data) {
    const tableBody = document.querySelector('#sheet-table tbody');
    tableBody.innerHTML = ''; // Vorherige Daten löschen

    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

// Funktion zum Formatieren der Zahlen (z.B. 14000 zu 140.00)
function formatNumber(value) {
    // Überprüfen, ob der Wert ein numerischer Wert ist und dann formatieren
    if (!isNaN(value)) {
        return (parseFloat(value) / 100).toFixed(2); // Wert durch 100 teilen und auf 2 Dezimalstellen formatieren
    }
    return value; // Falls der Wert kein numerischer Wert ist, bleibt er unverändert
}

// API laden und initialisieren
function loadApi() {
    gapi.load('client', initApi);
}

// Starte das Laden der API
loadApi();