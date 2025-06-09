Qualtrics.SurveyEngine.addOnReady(function() {
    console.log("GHG Footprint script started.");
  
    // These are the survey answers from that are stored in Qualtrics. 
    var qData = {
      q1  : '${q://QID123/SelectedChoicesRecode}', // Do you have access to a car?
      q2  : '${q://QID1/SelectedChoicesRecode}', // What best describes the access (own a car, company car)
      q3  : '${q://QID2/SelectedChoicesRecode}', // What is the fuel type of the car (eg. petrol)
      q4  : '${q://QID3/SelectedChoicesRecode}', // What is the size of the car?
      q5  : '${q://QID4/ChoiceNumericEntryValue/1}', // What is your yearly mileage?
      q6  : '${q://QID5/SelectedChoicesRecode}', // How often do you use public transit?
      q7  : '${q://QID201/ChoiceTextEntryValue}', // What is the annual usage of public transit?
      q8  : '${q://QID10/SelectedChoicesRecode}', // How often do you travel by plane?
      q9  : '${q://QID12/ChoiceTextEntryValue}', // What are the number of short flights?
      q10 : '${q://QID13/ChoiceTextEntryValue}', // What are the number of medium flights?
      q11 : '${q://QID14/ChoiceTextEntryValue}', // What are the number of long flights?
      q12 : '${q://QID21/SelectedChoicesRecode}', // What is your diet (eg. omnivore)
      q13 : '${q://QID35/SelectedChoicesRecode}', // What best describes your residence?
      q14 : '${q://QID23/SelectedChoicesRecode}', // When was your house built?
      q15 : '${q://QID25/ChoiceTextEntryValue}', // What is your household size in square foot?
      q16 : '${q://QID26/SelectedChoicesRecode}' // What is your heating type?
    };
  
    // 
    var mappings = {
      dietToggle: {
        value: qData.q12,
        map: { "1": "omnivore", "2": "flexitarian", "3": "vegetarian", "4": "vegan" }
      },
      vehicleToggle: {
        value: qData.q3,
        map: { "1": "current", "2": "hybrid", "3": "electric", "4": "none" }
      },
      flightToggle: {
        value: (qData.q8 && qData.q8.trim() !== "") ? qData.q8 : "3",  // default to "without"
        map: { "1": "with", "2": "additional", "3": "without" }
      },
      heatToggle: {
        value: qData.q16,
        map: { "1": "current", "2": "oil", "3": "gas", "4": "pump" }
      }
    };
  
    Object.keys(mappings).forEach(function(name) {
      var value = mappings[name].value;
      var map = mappings[name].map;
      var key = map[value ? value.trim() : ""];
      if (key) {
        var input = document.querySelector('input[name="' + name + '"][value="' + key + '"]');
        if (input) input.checked = true;
      }
    });
  
    var peData = formatSurveySettings(qData);
    var total = getStartingTotal(peData);
  
    var userDiet     = +total.actualDiet.toFixed(2);
    var userMobility = +total.actualMobility.toFixed(2) - +total.actualFlight;
    var originalFlight = +total.actualFlight || 0;
    var userHouse    = +total.actualHouse.toFixed(2);
  
    var hasFlown = originalFlight > 0;
    var simulatedLongFlight = 7.0;
    var globalAverage = 5.2;
    var sustainableTarget = 3.0;
  
    var ctx = document.getElementById("carbonChartComparison").getContext("2d");
  
    function getYMax() {
      var max = userDiet + userMobility + userHouse + originalFlight + simulatedLongFlight;
      return Math.ceil(max + 1);
    }
  
    var chartCombined = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ["Your Emissions", "Global Average", "Sustainable Target"],
        datasets: [
          { label: "Diet",     data: [userDiet, 0, 0], backgroundColor: "rgba(217,155,253,0.8)" },
          { label: "Mobility", data: [userMobility, 0, 0], backgroundColor: "rgba(158,195,255,0.8)" },
          { label: "Flight",   data: [originalFlight, 0, 0], backgroundColor: "rgba(255,205,86,0.8)" },
          { label: "House",    data: [userHouse, 0, 0], backgroundColor: "rgba(112,128,144,0.8)" },
          { label: "Global",   data: [0, globalAverage, 0], backgroundColor: "#4caf50" },
          { label: "Target",   data: [0, 0, sustainableTarget], backgroundColor: "#8bc34a" }
        ]
      },
      options: {
        scales: {
          xAxes: [{ stacked: true }],
          yAxes: [{
            stacked: true,
            ticks: {
              beginAtZero: true,
              max: getYMax(),
              callback: function(v) { return v + " t"; },
              fontColor: "#333"
            },
            scaleLabel: {
              display: true,
              labelString: "t CO₂/year",
              fontColor: "#333"
            },
            gridLines: { color: "rgba(0,0,0,0.1)" }
          }]
        },
        legend: {
          position: "bottom",
          onClick: function() {},
          labels: { fontColor: "#333" }
        },
        title: {
          display: true,
          text: "Comparison: Your Emissions vs. Global & Sustainable Targets",
          fontColor: "#333"
        }
      }
    });
  
    // Override chart if no flight selection was made
    if (!qData.q8 || qData.q8.trim() === "") {
      var assumedFlight = +(originalFlight + simulatedLongFlight).toFixed(2);
      chartCombined.data.datasets[2].data[0] = assumedFlight;
      jQuery('input[name="flightToggle"][value="without"]').prop("checked", true);
      chartCombined.update();
    }
  
    function updateFootprintTotal() {
      var ds = chartCombined.data.datasets;
      var sum = ds[0].data[0] + ds[1].data[0] + ds[2].data[0] + ds[3].data[0];
      jQuery("#footprint").html(sum.toFixed(1) + " t CO<sub>₂</sub>/year");
    }
    updateFootprintTotal();
  
    var dietParameter = new Map([
      ["omnivore", 1.837],
      ["flexitarian", 1.495],
      ["vegetarian", 1.380],
      ["vegan", 1.124]
    ]);
  
    function simulateDiet(type) {
      return dietParameter.has(type) ? dietParameter.get(type) : userDiet;
    }
  
    var carParameter = new Map([
      ["petrol-small",  new Map([["co2", 235]])],
      ["petrol-medium", new Map([["co2", 245]])],
      ["petrol-large",  new Map([["co2", 270]])],
      ["diesel-medium", new Map([["co2", 245]])],
      ["diesel-large",  new Map([["co2", 285]])],
      ["phev-medium",   new Map([["co2", 180]])],
      ["phev-large",    new Map([["co2", 270]])],
      ["bev-small",     new Map([["co2", 50]])],
      ["bev-medium",    new Map([["co2", 50]])],
      ["bev-large",     new Map([["co2", 55]])]
    ]);
  
    function simulateVehicle(type) {
      var engineMap = {
        current:  "petrol",
        hybrid:   "phev",
        electric: "bev",
        none:     null
      };
  
      var prefix = engineMap[type];
      var vehicleSize = qData.q4 ? qData.q4.toLowerCase().trim() : "";
      var yearlyKm = parseFloat(qData.q5);
  
      if (!prefix || !vehicleSize || isNaN(yearlyKm) || yearlyKm <= 0) return 0;
  
      var key = prefix + "-" + vehicleSize;
      if (!carParameter.has(key)) return 0;
  
      var co2gPerKm = carParameter.get(key).get("co2");
      return +(co2gPerKm * yearlyKm / 1000000).toFixed(2);
    }
  
    function simulateHeating(type) {
      switch(type) {
        case "current": return userHouse;
        case "oil":     return +(userHouse * 1.10).toFixed(2);
        case "gas":     return +(userHouse * 0.90).toFixed(2);
        case "pump":    return +(userHouse * 0.50).toFixed(2);
      }
    }
  
    // ===== Toggle Handlers =====
    jQuery('input[name="flightToggle"]').change(function() {
      var sel = jQuery(this).val();
  
      // If "without" is selected, override to simulate both current and additional flights
      var newFlight = sel === "with"
        ? (hasFlown ? originalFlight : 0)
        : sel === "additional"
        ? +(originalFlight + simulatedLongFlight).toFixed(2)
        : +(originalFlight + simulatedLongFlight).toFixed(2); // treating "without" as combo
  
      chartCombined.data.datasets[2].data[0] = newFlight;
      updateFootprintTotal();
      chartCombined.update();
    });
  
    jQuery('input[name="heatToggle"]').change(function() {
      var newVal = simulateHeating(jQuery(this).val());
      chartCombined.data.datasets[3].data[0] = newVal;
      updateFootprintTotal();
      chartCombined.update();
    });
  
    jQuery('input[name="vehicleToggle"]').change(function() {
      var newVal = simulateVehicle(jQuery(this).val());
      chartCombined.data.datasets[1].data[0] = newVal;
      updateFootprintTotal();
      chartCombined.update();
    });
  
    jQuery('input[name="dietToggle"]').change(function() {
      var newVal = simulateDiet(jQuery(this).val());
      chartCombined.data.datasets[0].data[0] = newVal;
      updateFootprintTotal();
      chartCombined.update();
    });
  });
