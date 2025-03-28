const apiKey = 'AIzaSyCdMprYvMXK3ZyuHgXMW9KyzmUcBudzyjI';
const spreadsheetId = '1mTFOskVbQb1oHVRPdfgqhHju7zfKa5ld4C6BSdSXlv4';
const range = 'ClashLB!A1:G100';

// Enddatum übergeben
const spreadsheetIdDate = '1mTFOskVbQb1oHVRPdfgqhHju7zfKa5ld4C6BSdSXlv4';
const rangeDate = 'Enddate!A1:A1';

// Preisliste nach Platzierung
const prizeDistribution = [250, 100, 75, 30, 25, 10, 10];

// Google API initialisieren
function initApi() {
    gapi.client.init({
        'apiKey': apiKey,
        'discoveryDocs': ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    }).then(() => {
        getSheetData();
    });
}

// Funktion zum Anpingen des Sheets
function pingSheetBeforeFetching() {
    // Anpingen des Sheets, um sicherzustellen, dass es bereit ist
    gapi.client.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId
    }).then(() => {
        // Wartezeit einfügen, um sicherzustellen, dass das Sheet bereit ist
        setTimeout(() => {
            // Daten abrufen, nachdem das Sheet bereit ist
            getSheetData();
        }, 1000); // 2000 Millisekunden (2 Sekunden) Wartezeit
    }).catch((error) => {
        console.error('Fehler beim Anpingen des Sheets:', error);
    });
}

// Laden der Google Sheets-Daten
function getSheetData() {
    setTimeout(() => {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range
    }).then((response) => {
        const data = response.result.values;
        if (data.length > 0) {
            const headers = data[0];  
            let filteredData = data.slice(1).map(row => [
                row[0],  // userId
                row[1],  // Name
                row[2],  // Avatar URL
                row[3],  // Active
                parseFloat(row[4]) || 0,  // Wagered (Wichtig für Platzierung)
                parseFloat(row[5]) || 0,  // Deposited
                parseFloat(row[6]) || 0   // Earned
            ]);

            // Spieler mit 0 Wagered entfernen
            filteredData = filteredData.filter(row => row[4] !== 0);

            // Sortieren nach Wagered (höchster Wert zuerst)
            filteredData.sort((a, b) => b[4] - a[4]);

            // Platzierungen vergeben + Preise zuweisen
            filteredData = filteredData.map((row, index) => {
                let prize = prizeDistribution[index] || 0;  // Falls Platz > 7 → 0 als Preis setzen
                return [...row, index + 1, prize]; // Platz & fixen Preis hinzufügen
            });

            console.log("Sortierte Daten mit Platzierungen & Preisen:", filteredData);

            // Top 3 anzeigen
            displayTopThreeInBoxes(filteredData.slice(0, 3));
            displayAllParticipants(filteredData.slice(3));

            // Enddatum aus dem Sheet ziehen
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetIdDate,
                range: rangeDate
            }).then((response) => {
                const dateData = response.result.values;
                if (dateData.length > 0) {
                    const date = dateData[0][0];  
                    console.log("Gefundenes Enddatum:", date); 
                    startCountdown(date);
                } else {
                    console.error('Kein Enddatum gefunden.');
                }
            }).catch(error => {
                console.error('Fehler beim Abrufen des Enddatums:', error);
                
            });
        } else {
            console.log('Keine Daten gefunden.');
            
        }
    }, (error) => {
        console.error('Fehler beim Abrufen der Daten:', error);
       
    });
}, 100); // 2000 Millisekunden (2 Sekunden) Wartezeit
}

// Die ersten drei Teilnehmer in Kacheln anzeigen
function displayTopThreeInBoxes(topThree) {
    const container = document.getElementById('top-three-container');
    container.innerHTML = ''; 

    topThree.forEach((row, index) => {
        const box = document.createElement('div');
        box.classList.add('participant-box-roll');

        box.innerHTML = `
            <h3>#${row[7]}</h3>
            <img src="${row[2]}" alt="Avatar" class="participant-avatar">
            <p class="participant-name"><strong>${row[1]}</strong></p>
            <p>Wagered: <strong>${row[4]}</strong></p>
            <p>Price:</p>
            <p><img src="/images/ClashGG-Gem.png" alt="Rollcoin" class="rollcoin-icon" style="width: 21px; height: 21px"><strong>${row[8]}</strong></p>
        `;

        if (index === 0) box.classList.add('top-box');
        else if (index === 1) box.classList.add('left-box');
        else if (index === 2) box.classList.add('right-box');

        container.appendChild(box);
    });
    
    
}

// Alle Teilnehmer in Tabelle anzeigen
function displayAllParticipants(participants) {
    const tbody = document.getElementById('sheet-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    participants.forEach((row) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${row[7]}</td> 
            <td><img src="${row[2]}" alt="Avatar" class="participant-avatar" style="width: 21px; height: 21px"> ${row[1]}</td> 
            <td>Wagered: <strong>${row[4]}</strong></td>
            <td>Price: <img src="/images/ClashGG-Gem.png" alt="Rollcoin" class="rollcoin-icon" style="width: 21px; height: 21px"><strong>${row[8]}</strong></td>
        `;

        tbody.appendChild(tr);
    });
    
}

// API laden und initialisieren
function loadApi() {
    gapi.load('client', initApi);
}

// Starte das Laden der API
loadApi();

// Timer für Countdown
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
    const interval = setInterval(updateCountdown, 1000);
}
