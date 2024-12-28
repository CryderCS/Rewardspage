async function fetchAndDisplayParticipantsData() {
    const url = 'https://api.rain.gg/v1/affiliates/races?participant_count=50';
    const headers = {
      'accept': 'application/json',
      'x-api-key': 'a74cf8c9-e7f8-4880-88e0-24553139e786' // Ersetzen Sie dies durch Ihren tatsächlichen API-Schlüssel
    };
    var options = {
        'method': 'get',
        'headers' : headers
    };

    try {
      const response = await fetch(url, options);
      const jsonResponse = await response.json();
  
      if (jsonResponse.results && Array.isArray(jsonResponse.results) && jsonResponse.results.length > 0) {
        const participantsData = [];
  
        jsonResponse.results.forEach(race => {
          if (race.participants && Array.isArray(race.participants) && race.participants.length > 0) {
            race.participants.forEach(participant => {
              participantsData.push([
                race.id,
                race.name,
                participant.username,
                participant.position,
                participant.experience,
                participant.prize,
                participant.wagered
              ]);
            });
          } else {
            participantsData.push([race.id, race.name, "Keine Teilnehmer gefunden"]);
          }
        });
  
        generateTable(participantsData);
      } else {
        generateTable([["Keine Renndaten gefunden"]]);
      }
    } catch (error) {
      console.error("Fehler beim Abrufen der Daten:", error);
      generateTable([["Fehler beim Abrufen der Daten"]]);
    }
  }
  
  // Funktion zum Erstellen und Einfügen der Tabelle
  function generateTable(data) {
    const container = document.getElementById('table-container');
    container.innerHTML = ''; // Vorherigen Inhalt löschen
  
    const table = document.createElement('table');
    table.style.width = '100%';
    table.setAttribute('border', '1');
  
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Renn-ID', 'Rennname', 'Benutzername', 'Position', 'Erfahrung', 'Preis', 'Eingesetzter Betrag'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
  
    const tbody = document.createElement('tbody');
    data.forEach(rowData => {
      const row = document.createElement('tr');
      rowData.forEach(cellData => {
        const td = document.createElement('td');
        td.textContent = cellData;
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
  
    container.appendChild(table);
  }
  
  // Initialer Aufruf der Funktion
  fetchAndDisplayParticipantsData();
  
  // Setzt ein Intervall, um die Funktion jede Stunde auszuführen
  setInterval(fetchAndDisplayParticipantsData, 3600000);