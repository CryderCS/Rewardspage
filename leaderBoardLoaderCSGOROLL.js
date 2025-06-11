const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';  // Dein API-Schlüssel
const spreadsheetId = '1Jn95fuSVCESmd2riDKIGofFoqYCmd3KdQd-BYSn28-A';  // Deine Spreadsheet-ID
const range = 'NewLeaderboard!A1:G100';  // Bereich
//Endatum übergeben
const spreadsheetIdDate = '1Jn95fuSVCESmd2riDKIGofFoqYCmd3KdQd-BYSn28-A';  // Deine Spreadsheet-ID
const rangeDate = 'EndDate!A1:A1';  // Bereich

let totalAmmount = 0;  // Gesamtbetrag



// Google API initialisieren
function initApi() {
    gapi.client.init({
        'apiKey': apiKey,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(() => {
        getSheetData();  // Google Sheets API abrufen
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
            const headers = data[0];  // Spaltenüberschriften
            let filteredData = data.slice(1).map(row => [
                row[0],   // Spalte A
                row[1],   // Spalte B
                Math.round((parseFloat(row[2]) || 0) * 100) / 100,   // Spalte C
                parseFloat(row[3]) || 0,  // Spalte D (Wert umwandeln in Float)
                row[4],   // Spalte E
                row[5],   // Spalte F
                row[6]   // Spalte G
            ]);

            // 0 Deposit entfernen
            filteredData = filteredData.filter(row => row[2] !== 0);

            // Gesamtbetrag berechnen
            let totalAmmount = filteredData.reduce((sum, row) => sum + row[3], 0);
            console.log("Gesamtbetrag:", totalAmmount);
            
            // Total Amount anzeigen
            document.getElementById("totalAmountDisplay").innerText = 
            `Total Ammount: ${totalAmmount.toLocaleString()}`;

            // Sortieren nach Spalte D (größter Wert zuerst)
            filteredData.sort((a, b) => b[3] - a[3]);

            // Platzierungen vergeben
            filteredData = filteredData.map((row, index) => [...row, index + 1]);

            console.log("Sortierte Daten mit Platzierungen:", filteredData);

            // Platzierungen vergeben & Bonus berechnen
            const bonusDistribution = [0.5, 0.2, 0.15, 0.06, 0.06, 0.03]; // Bonus für die Plätze 1-6
            filteredData = filteredData.map((row, index) => {
                let bonus = 0;
                if (index < bonusDistribution.length) {
                    bonus = totalAmmount * bonusDistribution[index]; // Prozentualer Anteil berechnen
                }
                return [...row, index + 1, bonus.toFixed(2)]; // Platzierung & Bonus als neue Spalten
            });
            console.log("Gefilterte und sortierte Daten mit Platzierungen & Boni:", filteredData);
            // Top 3 anzeigen
            displayTopThreeInBoxes(filteredData.slice(0, 3));
            displayAllParticipants(filteredData.slice(3));
            
            // Enddatum für Countdown aus Blatt ziehen
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetIdDate,
                range: rangeDate
            }).then((response) => {
                const dateData = response.result.values;
                let date = null; // Variable außerhalb der Funktion definieren
            
                if (dateData.length > 0) {
                    date = dateData[0][0];  // Korrekte Schreibweise
                } else {
                    console.error('Kein Enddatum gefunden.');
                }
            
                // Countdown starten (muss hier im Callback sein!)
                if (filteredData.length > 0 && date) {
                    console.log("Gefundenes Enddatum:", date); 
                    startCountdown(date);  
                } else {
                    console.error("Kein gültiges Enddatum gefunden.");
                }
            }).catch(error => {
                console.error('Fehler beim Abrufen des Enddatums:', error);
            });} else {
            console.log('Keine Daten gefunden.');
        }
    }, (error) => {
        console.error('Fehler beim Abrufen der Daten:', error);
    });
    

}

// Spaltenüberschriften in die HTML-Tabelle einfügen
// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const container = document.getElementById('top-three-container');
    container.innerHTML = ''; // Vorherige Inhalte löschen

    topThree.forEach((row, index) => {
        const box = document.createElement('div');
        box.classList.add('participant-box-roll');

        // HTML-Inhalt für die Box erstellen
        box.innerHTML = `
            <h3>#${row[8]}</h3>
            <img src="/images/CSGOROLL_Logo.png" alt="ProfilePic" style="width: auto; height: 50px">
            <p class="participant-name"><strong>${row[1]}</strong></p>
            <p class="info-box">Deposited: <br> <strong>${row[2]}</strong> </p>
            <p class="info-box">Prize: <br> <img src="/images/Rollcoin.png" alt="Rollcoin" style="width: 19px; height: 19px"><strong>${row[9]}</strong> </p>
            
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
            <td>${row[8]}</td> 
            <td>${row[1]}</td> 
            <td>Deposit: <strong>${row[2]}</strong></td>
            <td>Price:<img src="/images/Rollcoin.png" alt="Rollcoin" style="width: 19px; height: 19px"><strong>${row[9]}</strong></td>
            `//<td><img src="${row[4]}" alt="Avatar" class="participant-avatar" style="width: 50px; height: 50px; border-radius: 50%;"></td> <!-- Avatar -->
        ;

        tbody.appendChild(tr);
    });
}

// API laden und initialisieren
function loadApi() {
    gapi.load('client', initApi);
}

// Starte das Laden der API
loadApi();
//Timer 
function startCountdown(targetDate) {
    const countdownElement = document.getElementById("countdown");

    function updateCountdown() {
        const now = new Date().getTime();
        const targetTime = new Date(targetDate).getTime();
        const timeRemaining = targetTime - now;

        if (timeRemaining <= 0) {
            countdownElement.innerHTML = "Zeit abgelaufen!";
            clearInterval(interval);
            return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 100);
}
// Bonusverteilung
const bonusDistribution = [
    { platz: "1. Place", prozent: "50%" },
    { platz: "2. Place", prozent: "20%" },
    { platz: "3. Place", prozent: "15%" },
    { platz: "4. Place", prozent: "6%" },
    { platz: "5. Place", prozent: "6%" },
    { platz: "6. Place", prozent: "3%" }
];

// Tabelle füllen
function createBonusTable() {
    const tableBody = document.querySelector("#bonusTable tbody");
    bonusDistribution.forEach(entry => {
        let row = document.createElement("tr");
        row.innerHTML = `<td>${entry.platz}</td><td>${entry.prozent}</td>`;
        tableBody.appendChild(row);
    });
}


// Wenn das DOM geladen ist, Tabelle erstellen
document.addEventListener("DOMContentLoaded", createBonusTable);



