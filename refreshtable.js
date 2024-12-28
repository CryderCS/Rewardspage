document.getElementById('refreshButton').addEventListener('click', function() {
    // API-Anfrage durchführen
    fetch('https://api.rain.gg/v1/affiliates/races?participant_count=50', {
        method: 'GET',
        headers: {
            'accept': 'application/json',
            'x-api-key': 'a74cf8c9-e7f8-4880-88e0-24553139e786' // Ersetzen Sie dies durch Ihren tatsächlichen API-Schlüssel
        }
    })
    .then(response => response.json())
    .then(data => {
        // Tabelle leeren
        const table = document.getElementById('dataTable');
        table.innerHTML = '';

        // Neue Tabellenköpfe hinzufügen
        const headerRow = document.createElement('tr');
        const headers = ['Rennen ID', 'Rennen Name', 'Benutzername', 'Position', 'Erfahrung', 'Preis', 'Einsatz'];
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Neue Tabellendaten hinzufügen
        data.results.forEach(race => {
            if (race.participants && Array.isArray(race.participants) && race.participants.length > 0) {
                race.participants.forEach(participant => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${race.id}</td>
                        <td>${race.name}</td>
                        <td>${participant.username}</td>
                        <td>${participant.position}</td>
                        <td>${participant.experience}</td>
                        <td>${participant.prize}</td>
                        <td>${participant.wagered}</td>
                    `;
                    table.appendChild(row);
                });
            } else {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${race.id}</td>
                    <td>${race.name}</td>
                    <td colspan="6">Keine Teilnehmer gefunden</td>
                `;
                table.appendChild(row);
            }
        });
    })
    .catch(error => {
        console.error('Fehler beim Abrufen der Daten:', error);
    });
});