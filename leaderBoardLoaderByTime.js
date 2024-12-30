async function getParticipantsData() {
  const url = 'https://api.rain.gg/v1/affiliates/races?participant_count=50'; // Replace with actual URL if different
  const headers = {
    'Accept': 'application/json',
    'x-api-key': '0d823393-654e-4210-b107-8622aac8110f' // Replace with your actual API key
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const jsonResponse = await response.json();

    if (jsonResponse.results && Array.isArray(jsonResponse.results) && jsonResponse.results.length > 0) {
      const participantsData = [];

      jsonResponse.results.forEach((race) => {
        if (race.participants && Array.isArray(race.participants) && race.participants.length > 0) {
          race.participants.forEach((participant) => {
            participantsData.push([
              race.id, // Race ID
              race.name, // Race Name
              participant.username, // Participant Username
              participant.position, // Position
              participant.experience, // Experience
              participant.prize, // Prize
              participant.wagered // Wagered Amount
            ]);
          });
        } else {
          participantsData.push([race.id, race.name, "No participants found"]);
        }
      });

      console.log(participantsData);
      return participantsData;
    } else {
      console.log("No race data found");
      return [["No race data found"]];
    }
  } catch (error) {
    console.error("Error fetching data:", error.message);
    return [["Error fetching data"]];
  }
}

console.log(getParticipantsData());