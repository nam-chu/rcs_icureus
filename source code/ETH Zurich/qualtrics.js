/*

Priority Evaluator
The following code is placed into the javascript section of the Qualtrics question. 
Note that there are two parts:
    1. The code to be placed to the information question right before the PE in order
       to get the total carbon footpring
    2. The code to be placed in the question containing the PE

It does the following:

addOnload   -> Injects a a style sheet to increase the view port and performs page adjustments
addOnReady  -> Setup of priority evaluator
addOnUnload -> Saves data and resets the styles

*/


/* ---- PART 1 - Information Question ---- */
Qualtrics.SurveyEngine.addOnReady(function()
{   
    // Test version 'Priority Evaluator'
	var qData = {
        lang : '${e://Field/Q_Language}',
        q1a : '${q://QID38/SelectedChoicesRecode}',       // access to car
		q1b : '${q://QID4/SelectedChoicesRecode}',      // owns car
        q2 : '${q://QID5/SelectedChoicesRecode}',       // fuel type
        q3 : '${q://QID6/SelectedChoicesRecode}',       // car size
        q4 : '${q://QID7/ChoiceNumericEntryValue/1}',   // car value
        q5 : '${q://QID8/ChoiceNumericEntryValue/1}',   // car kilometrage yearly
        q6 : '${q://QID9/SelectedChoicesRecode}',       // frequency of public transport use --> adds dependency
        q7 : '${q://QID10/ChoiceTextEntryValue}',       // public transport kilometrage
        q8 : '${q://QID11/SelectedChoicesRecode}',      // public transport season ticket
        q9 : '${q://QID12/SelectedChoicesRecode}',      // how often travel by airplane -> adds conditions on next 3
        q10 : '${q://QID14/ChoiceTextEntryValue}',      // short flights
        q11 : '${q://QID16/ChoiceTextEntryValue}',      // medium flights
        q12 : '${q://QID18/ChoiceTextEntryValue}',      // long flights
        q13 : '${q://QID19/SelectedChoicesRecode}',     // has bike / bike frequency
        q14 : '${q://QID20/ChoiceTextEntryValue}',      // kilometrage bike
        q15 : '${q://QID21/ChoiceTextEntryValue}',      // kilometrage Ebike
        q17 : '${q://QID23/SelectedChoicesRecode}',     // diet
        q18 : '${q://QID24/SelectedChoicesRecode}',     // owns house
        q19 : '${q://QID25/SelectedChoicesRecode}',     // kind of residence
        q20 : '${q://QID26/SelectedChoicesRecode}',     // house standard
        q21 : '${q://QID27/SelectedChoicesRecode}',     // household members
        q22 : '${q://QID28/ChoiceTextEntryValue}',      // household size (area)
        q23 : '${q://QID29/SelectedChoicesRecode}',     // heating type
		q24: '${q://QID56/SelectedChoicesRecode}',    // has solar panels
        certificatePrice : '${e://Field/zert_preis}',
        hiddenTextSelector: "#QR\\~QID36"               // the selector of the hidden text input field used to force respondent to reach target
    }

    // Live Version
    var qData = {
        lang : '${e://Field/Q_Language}',
        q1a : '${q://QID123/SelectedChoicesRecode}', // access to car
        q1b : '${q://QID1/SelectedChoicesRecode}', // owns car
        q2 : '${q://QID2/SelectedChoicesRecode}', // fuel type
        q3 : '${q://QID3/SelectedChoicesRecode}', // car size
        q4 : '${q://QID34/ChoiceNumericEntryValue/1}', // car value
        q5 : '${q://QID4/ChoiceNumericEntryValue/1}', // car kilometrage yearly
        q6 : '${q://QID5/SelectedChoicesRecode}', // frequency of public transport use
        q7 : '${q://QID6/ChoiceTextEntryValue}', // public transport kilometrage
        q8 : '${q://QID120/SelectedChoicesRecode}', // public transport season ticket
        q9 : '${q://QID10/SelectedChoicesRecode}', // how often travel by airplane -> adds conditions on next 3
        q10 : '${q://QID12/ChoiceTextEntryValue}', // short flights
        q11 : '${q://QID13/ChoiceTextEntryValue}', // medium flights
        q12 : '${q://QID14/ChoiceTextEntryValue}', // long flights
        q13 : '${q://QID16/SelectedChoicesRecode}', // has bike / bike frequency
        q14 : '${q://QID17/ChoiceTextEntryValue}', // kilometrage bike
        q15 : '${q://QID19/ChoiceTextEntryValue}', // kilometrage Ebike
        q17 : '${q://QID21/SelectedChoicesRecode}', // diet 
        q18 : '${q://QID22/SelectedChoicesRecode}', // owns house
        q19 : '${q://QID35/SelectedChoicesRecode}', // kind of residence
        q20 : '${q://QID23/SelectedChoicesRecode}', // house standard
        q21 : '${q://QID24/SelectedChoicesRecode}', // household members
        q22 : '${q://QID25/ChoiceTextEntryValue}', // household size(area)
        q23 : '${q://QID26/SelectedChoicesRecode}', // heating type
        q24: '${q://QID143/SelectedChoicesRecode}', // has solar panels
        certificatePrice : '${e://Field/zert_preis}',
        hiddenTextSelector: "#QR\\~QID122",          // the selector of the hidden text input field used to force respondent to reach target
        version : "live"
    };

	var peData = formatSurveySettings(qData);
	window.peData = peData;
	Qualtrics.SurveyEngine.setEmbeddedData('PeInput', JSON.stringify(peData));
	var total = getStartingTotal(peData);
	Qualtrics.SurveyEngine.setEmbeddedData('PeStartTotal', total.actualTotal.toFixed(2));
	jQuery("#footprint").html(total.actualTotal.toFixed(1).toString() + " t CO<sub>2</sub>");
});


/* ---- PART 2 - Priority Evaluator ---- */
Qualtrics.SurveyEngine.addOnload(function()
{
	console.log("onLoad");
     /* Inject CSS for larger view port */
	var styles = `
	.Skin .SkinInner {width:100% !important; }
    .Skin .SkinInner { padding-top:20px !important ;}
	.Skin .QuestionOuter.Matrix{ max-width: 100%; }
    .Skin #Buttons { margin-top:1px !important; padding-top:1px !important }
	`;
	var styleSheet = document.createElement("style");
	styleSheet.type = "text/css";
	styleSheet.innerText = styles;
	styleSheet.id = "myfullwidth";
	document.head.appendChild(styleSheet);
    /* Hide a few elements */
    jQuery(".LanguageSelectorContainer").hide();
    jQuery("#BrandingFooter").hide();
	
	/* Hide validator question, ID may vary between surveys (QID36 for Priority_Evaluator)*/
    jQuery("#QID122").hide();
});

let my_interval;
Qualtrics.SurveyEngine.addOnReady(function()
{
	console.log("onReady");
	onload(window.peData);
    Qualtrics.SurveyEngine.setEmbeddedData('PeStart', JSON.stringify(getResults()));
	// START change text of response message (plus in unload)
	// find out which text to set
	let lang = jQuery("#Q_lang").val().toLowerCase();
	if (lang == "de") var popupTexts = texts.de.errorPopUp;
    else if (lang == "fr") var popupTexts = texts.fr.errorPopUp;
    else if (lang == "it") var popupTexts = texts.it.errorPopUp;
    else var popupTexts = texts.en.errorPopUp;
	
	// change the text
	document.querySelector("#NextButton").onclick = function() {
        my_interval = setInterval(() => {
            err_msg = document.querySelector("#ErrorMessage");
			button_continue = document.querySelector(".ErrorButtons button:first-child");
			button_cancel = document.querySelector(".ErrorButtons button:nth-child(2)");
            if (err_msg != null && button_continue != null && button_cancel != null) {
                err_msg.innerText = popupTexts.errMsg;
				button_continue.innerText = popupTexts.buttonContinue;
				button_cancel.innerText = popupTexts.buttonCancel;
                clearInterval(my_interval);
            }
        }, 10);  
    };
	// END
});

Qualtrics.SurveyEngine.addOnPageSubmit(function(type)   
{
	console.log("onSubmit");
    removeEvaluatorEventListeners();
	var peData = getResults();
    window.peData = peData;
	console.log(peData);
	Qualtrics.SurveyEngine.setEmbeddedData('PeEnd', JSON.stringify(peData));
	
	// set other embedded data
	Qualtrics.SurveyEngine.setEmbeddedData('PeTargetReached', peData.targetReached);
	Qualtrics.SurveyEngine.setEmbeddedData('PeRemainingCosts', peData.targetRemainingCosts);
    Qualtrics.SurveyEngine.setEmbeddedData('PeRemainingEmissions', (peData.actual - peData.target).toFixed(1));
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	console.log("onUnload");

    clearInterval(my_interval); // for the changed texts of error message

    /* Viewport back to normal */
	var sheet = document.getElementById("myfullwidth");
    sheet.parentNode.removeChild(sheet);
    /* Bring hidden elements back */
    jQuery(".LanguageSelectorContainer").hide();
    jQuery("#BrandingFooter").hide();
});