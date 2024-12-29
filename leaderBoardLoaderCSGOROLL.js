const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';  // Dein API-Schlüssel
const spreadsheetId = '1Jn95fuSVCESmd2riDKIGofFoqYCmd3KdQd-BYSn28-A';  // Deine Spreadsheet-ID
const range = 'Sheet1!A1:D10';  // Bereich A1 bis D10 (nur Spalten A, B, C, D)

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

            // Nur die Spalten A (0), B (1), C (2) und D (3) extrahieren, ab der zweiten Zeile
            const filteredData = data.slice(1).map(row => [
                row[0],  // Spalte A
                row[1],  // Spalte B
                row[2],  // Spalte C
                row[3]   // Spalte D
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
        // Wir filtern nur die Spalten A, B, C und D
        if (index === 0 || index === 1 || index === 2 || index === 3) {
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

// API laden und initialisieren
function loadApi() {
    gapi.load('client', initApi);
}

// Starte das Laden der API
loadApi();
