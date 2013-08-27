/**
 * @author Jason Rogena J.Rogena@cgiar.org
 * @version 
 */

/**
 * Sabilates is the only class in this file.
 * 
 * The constructor does all initialization of the UI.
 * All javascript libraries and css files to be used in this file have been imported in index.html
 *They include:
 *  - jquery-2.0.3.js
 *  - d3.v3.min.js
 *  - rcolor.js
 *  - stabilates.css
 */
function TickStabilates() {
   //constructor
   window.d3.tickStabilatesObject = this;
   var dataURL = "./php/getTickMaterial.php"; 
   var jsonObject = this.fetchDatabaseData(dataURL);
   this.stabilates = jsonObject.stabilates;
   this.parasites = jsonObject.parasites;
   this.frozenMaterial = jsonObject.frozenMaterial;
   
   /*get the true start date
   assumes that the stabilates have been sorted using the date_prepared element
   gets the first stabilate without a blank date_prepared*/
   var stabilateSize = this.stabilates.length;
   this.startDate = "0000-00-00";
   for( var i = 0; i < stabilateSize; i++ ) {
      if( this.stabilates[i].date_prepared != "0000-00-00") {
         this.startDate = new Date(this.stabilates[i].date_prepared);
         break;
      }
   }
   this.endDate = new Date(this.stabilates[this.stabilates.length - 1].date_prepared);
   
   //this.getSearchIndexes();
   
   this.parasiteColors = this.getParasiteColors();
   
   //originalXs and originalYs store the coordinates of the zoomed circles, if any
   this.originalXs = new Array();
   this.originalYs = new Array();
   this.zoomedCircles = new Array();
   
   this.windowHeight = jQuery(window).height();
   this.windowWidth = jQuery(window).width();
   this.sideMenuWidth = 400;
   
   var svg = d3.select("body")
                .append("div");
   
   this.body = d3.select("body");
   
   this.toolTip = this.body.append("div")
                     .attr("class", "tooltip")
                     .style("opacity", 0);
   this.circleTooltip = this.body.append("div")
                           .attr("class", "circleTooltip")
                           .style("opacity", 0);
   this.sideMenuTitle = this.body.append("div")
                           .attr("class","sideMenuTitle")
                           .style("opacity",0);
   this.numberOfTickStabilates = this.body.append("div")
                                    .attr("class","sideMenuText")
                                    .style("opacity",0);
   this.numberOfParasites = this.body.append("div")
                              .attr("class","sideMenuText")
                              .style("opacity",0);
   this.parasitesPresent = this.body.append("div")
                              .attr("class","sideMenuText")
                              .style("opacity",0);
   
   this.ignoreClick = false;//flag that tells the body to ignore the last click event
   this.ignoreFocus = false;//flag that tells the body to ignore the last focus event
   this.createZoomModeAxisLabels();
   this.createYAxisLabels();
   this.createXAxisLabels();
   this.createDownloadLink();
   this.createThemeLink();
   this.lastNumberOfChars = 0;
   this.searchBox = this.createSearchBox();
   this.searchSuggestionBox = this.createSearchSuggestionBox();
   
   this.darkThemeBackgroundColor = "#041117";
   this.body.style("background-color", this.darkThemeBackgroundColor);
   this.body.on("mousemove", function() {
      if(window.d3.tickStabilatesObject.zoomedCircles.length == 0 && window.d3.tickStabilatesObject.ignoreFocus == false) {
         window.d3.tickStabilatesObject.setTooltip(d3.mouse(this)[0],d3.mouse(this)[1]);
      }
      else {
         window.d3.tickStabilatesObject.toolTip.transition()        
                                                   .duration(50)      
                                                   .style("opacity", 0);
      }
   });
   this.body.on("mouseout", function() {
      window.d3.tickStabilatesObject.toolTip.transition()        
                                                .duration(50)      
                                                .style("opacity", 0);
   });
   
   this.canvas = this.body.append("svg")
                              .attr("width", this.windowWidth)
                              .attr("height", this.windowHeight);
}

//methods start here

/**
 * This method fetches database data
 * 
 * Note that this method is synchronous and therefore the time to execution of anything called after this method
 * is dependant on the time of execution of this method
 * 
 * @returns JsonObject, null
 */
TickStabilates.prototype.fetchDatabaseData = function (dataURL) {
   var result = null;
   jQuery.ajax ({
      url: dataURL,
      dataType: 'json',
      async: false,
      success: function(data) {
         result = data;
      }
   });
   return result;
};

/**
 * This method fetches the searchable values from the stabilates, parasites and materials objects
 * 
 * Note that the items are added to the searchIndexes array in the order of preference
 * 
 * @returns Array
 */
TickStabilates.prototype.getSearchIndexes = function () {
   var searchIndexes = new Array();
   var searchIndexesSize = 0;
   
   var parasitesSize = window.d3.tickStabilatesObject.parasites.length;
   console.log("parasite size : "+parasitesSize);
   for( var i = 0; i < parasitesSize; i++ ) {
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.parasites[i].parasite_name;
      searchIndexesSize++;
   }
   
   var materialsSize = window.d3.tickStabilatesObject.frozenMaterial.length;
   console.log("materials size : "+materialsSize);
   for( var i = 0; i < materialsSize; i++) {
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.frozenMaterial[i].material_name;
      searchIndexesSize++;
   }
   
   var stabilateSize = window.d3.tickStabilatesObject.stabilates.length;
   console.log("stabilates size : "+stabilateSize);
   for( var i = 0; i < stabilateSize; i++) {
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.stabilates[i].stabilate_no;
      searchIndexesSize++;
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.stabilates[i].date_prepared;
      searchIndexesSize++;
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.stabilates[i].stock;
      searchIndexesSize++;
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.stabilates[i].origin;
      searchIndexesSize++;
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.stabilates[i].experiment_no;
      searchIndexesSize++;
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.stabilates[i].remarks;
      searchIndexesSize++;
   }
   return searchIndexes;
};

/**
 * This method creates unique colors for all the parasites
 * 
 * This method uses the RColor library (rcolor.js)
 * It returns an array of hexadecimal numbers representing colors
 * 
 * @returns Array
 */
TickStabilates.prototype.getParasiteColors = function () {
   var parasiteColors = new Array();
   var color=new RColor;
   var parasitesSize = this.parasites.length;
   for( var i = 0; i < parasitesSize; i++) {
      parasiteColors[i] = color.get(true, 0.8, 0.99);
   }
   
   return parasiteColors;
};

/**
 * This method creates x axis labels for when UI is in zoom mode
 * 
 * The x axis labels when in zoom mode are months of the year
 */
TickStabilates.prototype.createZoomModeAxisLabels = function () {
   var availableWidth = this.windowWidth - this.sideMenuWidth;
   var monthWidth = availableWidth / monthsSize;
   var months = new Array();
   months[0] = "Jan";
   months[1] = "Feb";
   months[2] = "Mar";
   months[3] = "Apr";
   months[4] = "May";
   months[5] = "June";
   months[6] = "July";
   months[7] = "Aug";
   months[8] = "Sept";
   months[9] = "Oct";
   months[10] = "Nov";
   months[11] = "Dec";
   var monthsSize = months.length;
   for(var i = 0; i < monthsSize; i++) {
      var yPosition = this.windowHeight - 10;
      var xPosition = (monthWidth * i) + 20;
      this.body.append("div")
                  .attr("class","zoomModeText")
                  .html(function() {
                     return months[i];
                  })
                  .style("left",xPosition+"px")
                  .style("top",yPosition+"px")
                  .style("opacity",0);
   }
};

/**
 * This method creates Y Axis labels that are shown when not in zoom mode
 */
TickStabilates.prototype.createYAxisLabels = function () {
   var materialsSize = this.frozenMaterial.length;
   for(var i = 0; i < materialsSize; i++) {
      var yAxisPosition = this.getYAxisPosition(i);
      this.body.append("div")
                  .attr("class","axisLabels")
                  .html(this.frozenMaterial[i].material_name)
                  .style("left",(this.windowWidth-60)+"px")
                  .style("top",yAxisPosition+"px");
   }
};

/**
 * This method calculates the Y axis position using the index of a frozen material in the frozenMaterial object
 * 
 * @returns var (Integer)
 */
TickStabilates.prototype.getYAxisPosition = function (materialIndex) {
  var materialHeight = this.windowHeight / this.frozenMaterial.length;
  return (materialHeight * materialIndex) +  ((materialHeight / 2) - 15);
};

/**
 * This method creates X Axis labels that are shown when not in zoom mode
 */
TickStabilates.prototype.createXAxisLabels = function () {
   var yearDiff = (this.endDate.getYear() + 1) - this.startDate.getYear();
   for( var i = 0; i < yearDiff; i++) {
      var xAxisPosition = this.getXAxisPosition(i);
      var year = this.startDate.getYear() + 1900 + i;
      this.body.append("div")
                  .attr("class", "axisLabels")
                  .html(year)
                  .style("left", xAxisPosition + "px")
                  .style("top", (this.windowHeight - 10) + "px");
   }
};

/**
 * This method calculates the X axis position using the index of a year where 0 is the index of the first year
 * 
 * @returns var (Integer)
 */
TickStabilates.prototype.getXAxisPosition = function (yearIndex) {
   var yearDiff = (this.endDate.getYear() + 1) - this.startDate.getYear();
   var yearWidth = this.windowWidth / yearDiff;
   return (yearWidth * yearIndex) + 7;
};

/**
 * This method creates the download link
 */
TickStabilates.prototype.createDownloadLink = function () {
   this.body.append("a")
         .attr("download","Tick_Stabilates.csv")
         .attr("class","download")
         .attr("href","")
         .html("Download")
         .style("left","20px")
         .style("top","20px")
         .on("mousemove",function() { window.d3.tickStabilatesObject.ignoreFocus = true; })
         .on("mouseout",function() { window.d3.tickStabilatesObject.ignoreFocus = false; })
         .on("click",function() {
                        window.d3.tickStabilatesObject.ignoreClick = true;
                        var thisA = d3.select(this);//this here means this current circle
                        thisA.attr("href",function() {
                        return "data:text/csv;charset=utf-8,"+window.d3.tickStabilatesObject.getDownloadText();
                     });
         });
};

/**
 * This method creates the csv text for download
 * 
 * @returns URI
 */
TickStabilates.prototype.getDownloadText = function () {
   var csv="stabilate_no, date_prepared, number_in_tank, parasite, stock, material_frozen, source, origin, source_species_id, experiment_no, vol_prepared, medium_used, cryoprotectant, no_stored, unit, colour, ticks_ground, ticks_ml, mean_infect, infected_acin, storage_loc, stabilate_test, testing_experiment, testing_date, stabilate_history, stabilate_passages, remarks\n";
   this.canvas.selectAll("circle").each( function(d) {
      var thisCircle = d3.select(this);//this here means this circle
      if(thisCircle.style("opacity") != 0) {
         var thisCSV=d.stabilate_no+", "+d.date_prepared+", "+d.number_in_tank+", "+window.d3.tickStabilatesObject.getParasiteName(d.parasite_id)+", "+d.stock+", "+window.d3.tickStabilatesObject.getMaterialName(d.frozen_material_id)+", "+d.source+", "+d.origin+", "+d.source_species_id+", "+d.experiment_no+", "+d.vol_prepared+", "+d.medium_used+", "+d.cryoprotectant+", "+d.no_stored+", "+d.unit+", "+d.colour+", "+d.ticks_ground+", "+d.ticks_ml+", "+d.mean_infect+", "+d.infected_acin+", "+d.storage_loc+", "+d.stabilate_test+", "+d.testing_experiment+", "+d.testing_date+", "+d.stabilate_history+", "+d.stabilate_passages+", "+d.remarks+"\n";
         csv=csv+thisCSV;
      }
   });
   return encodeURI(csv);
};

TickStabilates.prototype.getParasiteName = function (parasiteID) {
   var parasitesSize = this.parasites.length;
   for(var i = 0; i < parasitesSize; i++) {
      if(this.parasites[i].id == parasiteID) {
         return this.parasites[i].parasite_name;
      }
   }
};

TickStabilates.prototype.getMaterialName = function (materialID) {
   var materialsSize = this.frozenMaterial.length;
   for(var i = 0; i < materialsSize; i++) {
      if(this.frozenMaterial[i].id == materialID) {
         return this.frozenMaterial[i].material_name;
      }
   }
};

TickStabilates.prototype.createThemeLink = function () {
   this.body.append("div")
               .attr("class","theme")
               .html("Change Theme")
               .style("left","100px")
               .style("top","20px")
               .on("mousemove",function()
                           {
                              window.d3.tickStabilatesObject.ignoreFocus = true;
                           })
               .on("mouseout",function()
                           {
                              window.d3.tickStabilatesObject.ignoreFocus = false;
                           })
               .on("click",function()
                  {
                     window.d3.tickStabilatesObject.ignoreClick = true;
                     //TODO: call change theme method
                  });
};

TickStabilates.prototype.createSearchBox = function () {
   return this.body.append("input")
               .style("z-index",11)
               .attr("class","search")
               .attr("value","Search")
               .style("top","50px")
               .style("left","20px")
               .style("width","250px")
               .style("color","white")
               .attr("type","text")
               .on("keyup",function() {
                              var numberDiff = Math.abs(window.d3.tickStabilatesObject.lastNumberOfChars - this.value.length);
                              if(numberDiff > 1) {
                                 window.d3.tickStabilatesObject.lastNumberOfChars = this.value.length;
                                 window.d3.tickStabilatesObject.setSearchSuggestions(this);
                              }
                           })
               .on("input",function() { window.d3.tickStabilatesObject.search(this); })
               .on("click", function() {
                              window.d3.tickStabilatesObject.ignoreClick = true;
                              this.value = "";
                              window.d3.tickStabilatesObject.search(this);
                           })
               .on("mousemove",function() { window.d3.tickStabilatesObject.ignoreFocus = true; })
               .on("mouseout",function() {
                                 window.d3.tickStabilatesObject.ignoreFocus = false;
                                 window.d3.tickStabilatesObject.body.selectAll(".suggestion").remove();
                              });
                           
};

TickStabilates.prototype.setSearchSuggestions = function (searchBox) {
   window.d3.tickStabilatesObject.searchSuggestionBox.selectAll(".suggestion").remove();
   if(searchBox.value.length > 1) {
      var searchIndexes = window.d3.tickStabilatesObject.getSearchIndexes();
      var searchIndexesSize = searchIndexes.length;
      for( var i = 0; i < searchIndexesSize; i++) {
         var position = searchIndexes[i].toLowerCase().indexOf(searchBox.value.toLowerCase());
         if(position != -1) {
            window.d3.tickStabilatesObject.searchSuggestionBox.append("p")
                                                      .attr("class","suggestion")
                                                      .text(searchIndexes[i])
                                                      .on("click",function() {
                                                                     searchBox.value = this.innerText;
                                                                     window.d3.tickStabilatesObject.search(searchBox);
                                                                     window.d3.tickStabilatesObject.searchSuggestionBox.selectAll(".suggestion").remove();
                                                                  });
         }
      }
   }
};

TickStabilates.prototype.search = function (searchBox) {
   window.d3.tickStabilatesObject.canvas.selectAll("circle").style("opacity", 0);
   window.d3.tickStabilatesObject.doParasiteSearch(searchBox);
   window.d3.tickStabilatesObject.doMaterialSearch(searchBox);
   window.d3.tickStabilatesObject.doStabilateSearch(searchBox);
   
};

TickStabilates.prototype.doParasiteSearch = function (searchBox) {
   var parasitesSize = window.d3.tickStabilatesObject.parasites.length;
   for(var i = 0; i < parasitesSize; i++) {
      var position = window.d3.tickStabilatesObject.parasites[i].parasite_name.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         window.d3.tickStabilatesObject.canvas.selectAll("circle").each( function(d) {
                                                   var thisCircle = d3.select(this);
                                                   if(d.parasite_id == window.d3.tickStabilatesObject.parasites[i].id) {
                                                      thisCircle.style("opacity", 1);
                                                   }
                                                });
      }
   }
};

TickStabilates.prototype.doMaterialSearch = function (searchBox) {
   var materialsSize = window.d3.tickStabilatesObject.frozenMaterial.length;
   for(var i = 0; i < materialsSize; i++) {
      var position = window.d3.tickStabilatesObject.frozenMaterial[i].material_name.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         window.d3.tickStabilatesObject.canvas.selectAll("circle").each( function(d) {
                                                   var thisCircle = d3.select(this);
                                                   if(d.frozen_material_id == window.d3.tickStabilatesObject.frozenMaterial[i].id) {
                                                      thisCircle.style("opacity",1);
                                                   }
                                                });
      }
   }
};

TickStabilates.prototype.doStabilateSearch = function (seachBox) {
   window.d3.tickStabilatesObject.canvas.selectAll("circle").each( function(d) {
      var thisCircle=d3.select(this);
      
      var searchX = d.remarks;
      var position = searchX.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         thisCircle.style("opacity",1);
         return 1;//no need to continue searching
      }
      
      searchX = d.stabilate_no;
      position = searchX.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         thisCircle.style("opacity",1);
         return 1;
      }

      searchX = d.date_prepared;
      position = searchX.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         thisCircle.style("opacity",1);
         return 1;
      }

      var searchX = d.stock;
      var position = searchX.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         thisCircle.style("opacity",1);
         return 1;
      }

      searchX = d.origin;
      position = searchX.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         thisCircle.style("opacity",1);
         return 1;
      }

      var searchX = d.experiment_no;
      var position = searchX.toLowerCase().indexOf(searchBox.value.toLowerCase());
      if(position != -1) {
         thisCircle.style("opacity",1);
         return 1;
      }
   });
};

TickStabilates.prototype.createSearchSuggestionBox = function () {
  return this.body.append("div")
               .attr("class","searchSuggestion")
               .style("width",function() { return window.d3.tickStabilatesObject.searchBox.style("width"); })
               .style("top","70px")
               .style("left",function() { return window.d3.tickStabilatesObject.searchBox.style("left"); })
               .on("click",function() { window.d3.tickStabilatesObject.ignoreClick = true; })
               .on("mousemove",function() { window.d3.tickStabilatesObject.ignoreFocus = true; })
               .on("mouseout",function() { window.d3.tickStabilatesObject.ignoreFocus = false; });
};

TickStabilates.prototype.setTooltip = function (x, y) {
   var startYear = window.d3.tickStabilatesObject.startDate.getYear()+1900;
   var yearDiff = (window.d3.tickStabilatesObject.endDate.getYear() + 1) - window.d3.tickStabilatesObject.startDate.getYear();
   var actualYear = window.d3.tickStabilatesObject.getYear(x);
   var materialIndex = window.d3.tickStabilatesObject.getMaterialIndex(y);
   var actualMaterialName = window.d3.tickStabilatesObject.frozenMaterial[materialIndex].material_name;
   window.d3.tickStabilatesObject.toolTip.transition()
                                             .duration(50)
                                             .style("opacity",.7);
   window.d3.tickStabilatesObject.toolTip.html(actualYear+"<br/>"+actualMaterialName)
                                          .style("left",x+"px")
                                          .style("top",y+"px");
};

TickStabilates.prototype.getYear = function (x) {
   var startYear = window.d3.tickStabilatesObject.startDate.getYear()+1900;
   var yearDiff = (window.d3.tickStabilatesObject.endDate.getYear() + 1) - window.d3.tickStabilatesObject.startDate.getYear();
   var a = parseInt((yearDiff*x)/window.d3.tickStabilatesObject.windowWidth,10);
   return a + startYear;
};

TickStabilates.prototype.getMaterialIndex = function (y) {
   var numberOfMaterials = window.d3.tickStabilatesObject.frozenMaterial.length;
   var materialHeight = window.d3.tickStabilatesObject.windowHeight / numberOfMaterials;
   return parseInt(y / materialHeight, 10);
};


