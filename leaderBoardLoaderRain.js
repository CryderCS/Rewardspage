const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI'; // Dein API-Schlüssel
const spreadsheetId = '1R9R6QH6A_mrwbR2RnpaOTSnjLKOzaMiPaVXiHxU_Z70'; // Dein Spreadsheet-ID (ersetze dies)
const range = 'Sheet1!A1:H100'; // Bereich in deinem Google Sheet

// Google API initialisieren
function initApi() {
    gapi.client.init({
        'apiKey': apiKey,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(() => {
        // Nach erfolgreicher Initialisierung die Daten abrufen
        getSheetData();
    }).catch((error) => {
        console.error('Fehler bei der Initialisierung der API:', error);
    });
}

// Laden der Google Sheets-Daten
function getSheetData() {
    // Warte 2 Sekunden bevor du die Daten abruft
    setTimeout(() => {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: range
        }).then((response) => {
            const data = response.result.values;
            if (data.length > 0) {
                // Nur die Spalten C (2), D (3), F (5) und G (6) extrahieren, ab der zweiten Zeile
                const filteredData = data.slice(1).map(row => [
                    row[2],  // Spalte C
                    row[3],  // Spalte D
                    formatNumber(row[5]),  // Spalte F mit Formatierung
                    row[6],   // Spalte G
                    row[7]
                ]);

                // Die ersten drei Ergebnisse in Kacheln anzeigen
                displayTopThreeInBoxes(filteredData.slice(0, 3));
                displayAllParticipants(filteredData.slice(3));
            } else {
                console.log('Keine Daten gefunden.');
            }
        }).catch((error) => {
            console.error('Fehler beim Abrufen der Daten:', error);
        });
    }, 100); // 2000 Millisekunden (2 Sekunden) Wartezeit
}


// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const container = document.getElementById('top-three-container');
    container.innerHTML = ''; // Vorherige Inhalte löschen

    topThree.forEach((row, index) => {
        const box = document.createElement('div');
        box.classList.add('participant-box');

        // HTML-Inhalt für die Box erstellen
        box.innerHTML = `
            <h3>#${row[1]}</h3>
            <img src="${row[4]}" alt="ProfilePic" class="participant-avatar">
            <p class="participant-name"><strong>${row[0]}</strong></p>
            <p>Prize:</p>
            <p><img src="/images/RainCoin.png" alt="Rollcoin" style="width: 19px; height: 19px"><strong>${row[2]}</strong> </p>
            <p>Wagered:</p>
            <p><strong>${row[3]}</strong> </p>
        `;

        // Boxen positionieren
        if (index === 0) {
            box.classList.add('top-box');  // Erste Box oben in der Mitte
        } else if (index === 1) {
            box.classList.add('left-box');  // Zweite Box links und leicht unterhalb
        } else if (index === 2) {
            box.classList.add('right-box');  // Dritte Box rechts und leicht unterhalb
        }

        container.appendChild(box);
    });
}
function displayAllParticipants(participants) {
    const tbody = document.getElementById('sheet-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Vorherige Inhalte löschen

    participants.forEach((row, index) => {
        const tr = document.createElement('tr');

        // Eine Zeile mit den jeweiligen Daten
        tr.innerHTML = `
            <td>${index + 1}</td> <!-- Position (ab 1. Platz) -->
            <td>${row[0]}</td> <!-- Username -->
            <td>${row[1]}</td> <!-- Prize -->
            <td><img src="/images/RainCoin.png" alt="Rollcoin" style="width: 19px; height: 19px">${row[2]}</td> <!-- Wagered -->
            <td><img src="${row[4]}" alt="Avatar" class="participant-avatar" style="width: 50px; height: 50px; border-radius: 50%;"></td> <!-- Avatar -->
        `;

        tbody.appendChild(tr);
    });
}
// Funktion zum Formatieren der Zahlen (z.B. 14000 zu 140.00)
function formatNumber(value) {
    if (!isNaN(value)) {
        return (parseFloat(value) / 100).toFixed(2); // Wert durch 100 teilen und auf 2 Dezimalstellen formatieren
    }
    return value; // Falls der Wert kein numerischer Wert ist, bleibt er unverändert
}

// API laden und initialisieren
function loadApi() {
    gapi.load('client', initApi);
}

// Starte das Laden der API, wenn die Seite vollständig geladen ist
document.addEventListener('DOMContentLoaded', loadApi);
