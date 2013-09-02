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
   var dataURL = "./php/getTickStabilates.php"; 
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
   
   this.windowHeight = jQuery(window).height() - 21;
   this.windowWidth = jQuery(window).width() - 8;
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
   this.stabilateColumns = new Array();
   this.downloadDialog = this.createDownloadDialog();
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
   this.body.on("click", function() {
      if(window.d3.tickStabilatesObject.ignoreClick == false) {
         window.d3.tickStabilatesObject.downloadDialog.style("opacity", 0);
         if(window.d3.tickStabilatesObject.zoomedCircles.length == 0) {
            var year = window.d3.tickStabilatesObject.getYear(d3.mouse(this)[0]);
            var materialIndex = window.d3.tickStabilatesObject.getMaterialIndex(d3.mouse(this)[1]);
            window.d3.tickStabilatesObject.zoomInOnSector(year,materialIndex);
            
         }
         else {
            window.d3.tickStabilatesObject.zoomOut();
            window.d3.tickStabilatesObject.zoomedCircles=new Array();
            window.d3.tickStabilatesObject.originalYs=new Array();
            window.d3.tickStabilatesObject.originalXs=new Array();
         }
      }
      else {
         window.d3.tickStabilatesObject.ignoreClick = false;
      }
   });
   
   this.canvas = this.body.append("svg")
                              .attr("width", this.windowWidth)
                              .attr("height", this.windowHeight);
   
   this.circles = this.canvas.selectAll("circle")
                                 .data(this.stabilates)
                                 .enter()
                                    .append("circle")
                                    .attr("r",1.5)
                                    .attr("fill", function(d) { return window.d3.tickStabilatesObject.getColor(d.parasite_id); })
                                    .attr("cx", function(d){ return window.d3.tickStabilatesObject.getXFromDate(d.date_prepared); })
                                    .attr("cy", function(d){ return window.d3.tickStabilatesObject.getY(d.frozen_material_id); })
                                    .on("mousemove", function(d) {
                                       var flag = false;
                                       var zoomedCirclesSize = window.d3.tickStabilatesObject.zoomedCircles.length;
                                       for(var i = 0; i < zoomedCirclesSize; i++) {
                                          if(window.d3.tickStabilatesObject.zoomedCircles[i].data()[0].id == d.id) {
                                             flag = true;
                                             break;
                                          }
                                       }
                                       if(flag == true) {
                                          var toolTipText="<table><tr><td>stabilate_no</td><td> : </td><td>"+d.stabilate_no+"</td></tr>";
                                          toolTipText=toolTipText+"<tr><td>parasite</td><td> : </td><td>"+window.d3.tickStabilatesObject.getParasiteName(d.parasite_id)+"</td></tr>";
                                          toolTipText=toolTipText+"<tr><td>stock</td><td> : </td><td>"+d.stock+"</td></tr>";
                                          toolTipText=toolTipText+"<tr><td>source</td><td> : </td><td>"+d.source+"</td></tr>";
                                          toolTipText=toolTipText+"<tr><td>origin</td><td> : </td><td>"+d.origin+"</td></tr>";
                                          toolTipText=toolTipText+"<tr><td>number</td><td> : </td><td>"+d.number_in_tank+"</td></tr></table>";
                                          window.d3.tickStabilatesObject.circleTooltip.transition()
                                                                                          .duration(50)
                                                                                          .style("opacity",.7);
                                          window.d3.tickStabilatesObject.circleTooltip.html(toolTipText)
                                                                                          .style("left",d3.select(this).attr("cx")+"px")
                                                                                          .style("top",d3.select(this).attr("cy")+"px");
                                       }
                                    })
                                    .on("mouseout",function(d) {
                                       window.d3.tickStabilatesObject.circleTooltip.transition()
                                                                                       .duration(50)      
                                                                                       .style("opacity", 0);
                                    });
   this.canvas.selectAll("rect")
                  .data(this.frozenMaterial)
                  .enter()
                     .append("rect")
                        .attr("width",this.windowWidth)
                        .attr("height",0.05)
                        .attr("fill","white")
                        .attr("y",function(d){return window.d3.tickStabilatesObject.getSeparatorY(d.id); });
    
    var yearDiff = (this.endDate.getYear() + 1) - this.startDate.getYear();
    var yearPix = this.windowWidth / yearDiff;
    for(var x = 0; x < yearDiff; x++) {
      var y = x * yearPix;
      this.canvas.append("rect")
                     .attr("width",0.05)
                     .attr("height",this.windowHeight)
                     .attr("fill","white")
                     .attr("x",y);
   }
}

//methods start here

/**
 * This method fetches database data
 * 
 * Note that this method is synchronous and therefore the time to execution of anything called after this method
 * is dependant on the time of execution of this method
 * 
 * @param {String} dataURL : the URL from where the json object will be fetched
 * 
 * @return JsonObject
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
 * This method fetches the searchable values from the stabilates, parasites and frozenMaterial objects
 * 
 * Note that the items are added to the searchIndexes array in the order of preference.
 * The stabilates, parasites and frozenMaterial objects are arrays
 * 
 * @return Array
 */
TickStabilates.prototype.getSearchIndexes = function () {
   var searchIndexes = new Array();
   var searchIndexesSize = 0;
   
   var parasitesSize = window.d3.tickStabilatesObject.parasites.length;
   for( var i = 0; i < parasitesSize; i++ ) {
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.parasites[i].parasite_name;
      searchIndexesSize++;
   }
   
   var materialsSize = window.d3.tickStabilatesObject.frozenMaterial.length;
   for( var i = 0; i < materialsSize; i++) {
      searchIndexes[searchIndexesSize] = window.d3.tickStabilatesObject.frozenMaterial[i].material_name;
      searchIndexesSize++;
   }
   
   var stabilateSize = window.d3.tickStabilatesObject.stabilates.length;
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
 * @return Array
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
   var availableWidth = this.windowWidth - this.sideMenuWidth;
   var monthsSize = months.length;
   var monthWidth = availableWidth / monthsSize;
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
 * Note that the frozenMaterial object is an array
 * 
 * @param {Integer} materialIndex : the index of the material in the frozenMaterial object
 * 
 * @return Integer
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
 * @param {Integer} yearIndex : the index of the year where 0 is the index of the first year
 * 
 * @return Integer
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
   this.body.append("div")
         /*.attr("download","Tick_Stabilates.csv")*/
         .attr("class","download")
         /*.attr("href","")*/
         .html("Download")
         .style("left","20px")
         .style("top","20px")
         .on("mousemove",function() { window.d3.tickStabilatesObject.ignoreFocus = true; })
         .on("mouseout",function() { window.d3.tickStabilatesObject.ignoreFocus = false; })
         .on("click",function() {
                        window.d3.tickStabilatesObject.ignoreClick = true;
                        window.d3.tickStabilatesObject.downloadDialog.style("opacity",1);
                        /*var thisA = d3.select(this);//this here means this current circle
                        thisA.attr("href",function() {
                        return "data:text/csv;charset=utf-8,"+window.d3.tickStabilatesObject.getDownloadText();
                     });*/
         });
};

/**
 * This method creates the csv text for download
 * 
 * @return URI
 */
TickStabilates.prototype.getDownloadText = function () {
   //var csv="stabilate_no, date_prepared, number_in_tank, parasite, stock, material_frozen, source, origin, source_species_id, experiment_no, vol_prepared, medium_used, cryoprotectant, no_stored, unit, colour, ticks_ground, ticks_ml, mean_infect, infected_acin, storage_loc, stabilate_test, testing_experiment, testing_date, stabilate_history, stabilate_passages, remarks\n";
   var csv = "";
   var stabilateColumnsSize = window.d3.tickStabilatesObject.stabilateColumns.length;
   for(var i = 0 ; i < stabilateColumnsSize; i++) {
      csv = csv + window.d3.tickStabilatesObject.stabilateColumns[i]+", ";
   }
   csv = csv +"\n";
   
   this.canvas.selectAll("circle").each( function(d) {
      var thisCircle = d3.select(this);//this here means this circle
      if(thisCircle.style("opacity") != 0) {
         //var thisCSV=d.stabilate_no+", "+d.date_prepared+", "+d.number_in_tank+", "+window.d3.tickStabilatesObject.getParasiteName(d.parasite_id)+", "+d.stock+", "+window.d3.tickStabilatesObject.getMaterialName(d.frozen_material_id)+", "+d.source+", "+d.origin+", "+d.source_species_id+", "+d.experiment_no+", "+d.vol_prepared+", "+d.medium_used+", "+d.cryoprotectant+", "+d.no_stored+", "+d.unit+", "+d.colour+", "+d.ticks_ground+", "+d.ticks_ml+", "+d.mean_infect+", "+d.infected_acin+", "+d.storage_loc+", "+d.stabilate_test+", "+d.testing_experiment+", "+d.testing_date+", "+d.stabilate_history+", "+d.stabilate_passages+", "+d.remarks+"\n";
         var thisCSV = "";
         var stabilateColumnsSize = window.d3.tickStabilatesObject.stabilateColumns.length;
         for(var i = 0; i < stabilateColumnsSize; i++) {
            if(window.d3.tickStabilatesObject.stabilateColumns[i] == "material_frozen") {
               thisCSV = thisCSV + window.d3.tickStabilatesObject.getMaterialName(d.frozen_material_id) + ", ";
            }
            else if(window.d3.tickStabilatesObject.stabilateColumns[i] == "parasite") {
               thisCSV = thisCSV + window.d3.tickStabilatesObject.getParasiteName(d.parasite_id) + ", ";
            }
            else {
               thisCSV = thisCSV + d[window.d3.tickStabilatesObject.stabilateColumns[i]]+", ";
            }  
         }
         thisCSV = thisCSV + "\n";
         csv=csv+thisCSV;
      }
   });
   return encodeURI(csv);
};

/**
 * This method gets the name of a parasite using the parasite's index in the parasites object
 * 
 * Note that the parasites object is an array
 * 
 * @param {Integer} parasiteID : the index of the parasite in the parasites object
 * 
 * @return String
 */
TickStabilates.prototype.getParasiteName = function (parasiteID) {
   var parasitesSize = this.parasites.length;
   for(var i = 0; i < parasitesSize; i++) {
      if(this.parasites[i].id == parasiteID) {
         return this.parasites[i].parasite_name;
      }
   }
};

/**
 * This method gets the name of a material using the material's index in the frozenMaterial object
 * 
 * Note that the frozenMaterial object is an array
 * 
 * @param {Integer} materialID
 * 
 * @return String
 */
TickStabilates.prototype.getMaterialName = function (materialID) {
   var materialsSize = this.frozenMaterial.length;
   for(var i = 0; i < materialsSize; i++) {
      if(this.frozenMaterial[i].id == materialID) {
         return this.frozenMaterial[i].material_name;
      }
   }
};

/**
 * This method creates the Theme link in the page
 */
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
                     window.d3.tickStabilatesObject.changeTheme();
                  });
};

/**
 * This method creates the search field in the page
 * 
 * @return D3 Object
 */
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
                                 //window.d3.tickStabilatesObject.body.selectAll(".suggestion").remove();
                              });
                           
};

/**
 * This method creates search suggestions using the text in the search field
 * 
 * @param {DOM Object} searchBox
 */
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

/**
 * This method initializes the searching process
 * 
 * @param {DOM Object} searchBox
 */
TickStabilates.prototype.search = function (searchBox) {
   window.d3.tickStabilatesObject.canvas.selectAll("circle").style("opacity", 0);
   window.d3.tickStabilatesObject.doParasiteSearch(searchBox);
   window.d3.tickStabilatesObject.doMaterialSearch(searchBox);
   window.d3.tickStabilatesObject.doStabilateSearch(searchBox);
   
};

/**
 * This method checks whether the value in the search field is in the parasites object
 * 
 * Note that the parasites object is an array
 * 
 * @param {DOM Object} searchBox
 */
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

/**
 * This method checks whether the value in the search field is in the frozenMaterial object
 * 
 * Note that the frozenMaterial object is an array
 * 
 * @param {DOM Object} searchBox
 */
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

/**
 * This method checks whether the value in the search field is in the stabilates object
 * 
 * Note that the stabilates object is an array
 * 
 * @param {DOM Object} searchBox
 */
TickStabilates.prototype.doStabilateSearch = function (searchBox) {
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

/**
 * This method creates a canvas on which search suggestions are added
 * 
 * @return D3 Object
 */
TickStabilates.prototype.createSearchSuggestionBox = function () {
  return this.body.append("div")
               .attr("class","searchSuggestion")
               .style("width",function() { return window.d3.tickStabilatesObject.searchBox.style("width"); })
               .style("top","70px")
               .style("left",function() { return window.d3.tickStabilatesObject.searchBox.style("left"); })
               .on("click",function() { window.d3.tickStabilatesObject.ignoreClick = true; })
               .on("mousemove",function() { window.d3.tickStabilatesObject.ignoreFocus = true; })
               .on("mouseout",function() { 
                                 window.d3.tickStabilatesObject.ignoreFocus = false;
                                 //window.d3.tickStabilatesObject.body.selectAll(".suggestion").remove();
                              });
};

/**
 * This method generates what is shown on the tooltip depending on where the cursor is on the screen
 * 
 * @param {Integer} x : the cursor's X coordinate
 * @param {Integer} y : the cursor's Y coordinate
 */
TickStabilates.prototype.setTooltip = function (x, y) {
   window.d3.tickStabilatesObject.body.selectAll(".suggestion").remove();
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

/**
 * This method calculates the year represented by an X coordinate
 * 
 * @param {Integer} x : the X coordinate of which you want to determine the year
 * 
 * @return Integer
 */
TickStabilates.prototype.getYear = function (x) {
   var startYear = window.d3.tickStabilatesObject.startDate.getYear()+1900;
   var yearDiff = (window.d3.tickStabilatesObject.endDate.getYear() + 1) - window.d3.tickStabilatesObject.startDate.getYear();
   var a = parseInt((yearDiff*x)/window.d3.tickStabilatesObject.windowWidth,10);
   return a + startYear;
};

/**
 * This method calculates the index of a frozen_material represented by an Y coordinate
 * 
 * @param {Integer} y : the Y coordinate of which you want to determine the frozen_material index
 * 
 * @return Integer
 */
TickStabilates.prototype.getMaterialIndex = function (y) {
   var numberOfMaterials = window.d3.tickStabilatesObject.frozenMaterial.length;
   var materialHeight = window.d3.tickStabilatesObject.windowHeight / numberOfMaterials;
   return parseInt(y / materialHeight, 10);
};

/**
 * This method zooms in on a particular sector in the UI
 * 
 * @param {Integer} year : The year represented by the sector
 * @param {Integer} materialIndex : The index of the material in the frozenMaterial object represeted by the sector
 */
TickStabilates.prototype.zoomInOnSector = function (year,materialIndex) {
   //(year,startDate.getYear()+1900,yearDiff,materialIndex,materials,canvas,originalXs,originalYs,zoomedCircles,body,sideMenuTitle,numberOfTickStabilates,numberOfParasites,toolTip,parasites,parasitesPresent,parasiteColors)
   var startYear = window.d3.tickStabilatesObject.startDate.getYear() + 1900;
   var yearDiff = (window.d3.tickStabilatesObject.endDate.getYear() + 1) - window.d3.tickStabilatesObject.startDate.getYear();
   var materialHeight = window.d3.tickStabilatesObject.windowHeight / window.d3.tickStabilatesObject.frozenMaterial.length;
   var yearWidth = window.d3.tickStabilatesObject.windowWidth / yearDiff;
   
   var xScaleFactor = (window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth) / yearWidth;
   var sectorX = yearWidth * (year - startYear);
   
   var yScaleFactor = window.d3.tickStabilatesObject.windowHeight / materialHeight;
   var sectorY = materialHeight * materialIndex;
   
   var noOfCirclesToBeAffected = 0;
   window.d3.tickStabilatesObject.canvas.selectAll("circle").each( function(d, i) {
      var thisCircle = d3.select(this);
      var x=thisCircle.attr("cx");
      var y=thisCircle.attr("cy");
      if((x >= sectorX && x < (sectorX + yearWidth)) && (y >= sectorY && y < (sectorY + materialHeight))) {
         noOfCirclesToBeAffected++;
      }
   });
   
   if(noOfCirclesToBeAffected > 0) {
      window.d3.tickStabilatesObject.canvas.selectAll("rect")
                                             .transition()
                                                .duration(800)
                                                .style("opacity",0);
                                                
      window.d3.tickStabilatesObject.canvas.selectAll("circle")
                                             .each( function(d, i) {
                                                var thisCircle=d3.select(this);
                                                var x=thisCircle.attr("cx");
                                                var y=thisCircle.attr("cy");
                                                if((x >= sectorX && x < (sectorX + yearWidth)) && (y >= sectorY && y < (sectorY + materialHeight))) {
                                                   window.d3.tickStabilatesObject.zoomedCircles[window.d3.tickStabilatesObject.zoomedCircles.length] = thisCircle;
                                                   window.d3.tickStabilatesObject.originalXs[window.d3.tickStabilatesObject.originalXs.length] = x;
                                                   window.d3.tickStabilatesObject.originalYs[window.d3.tickStabilatesObject.originalYs.length] = y;
                                                   var relativeX = x - sectorX;
                                                   var newX = parseInt(relativeX * xScaleFactor, 10);
                                                   
                                                   var relativeY = y - sectorY;
                                                   var newY = parseInt(relativeY * yScaleFactor, 10);
                                                   
                                                   var tData = thisCircle.data()[0];
                                                   thisCircle.transition()
                                                               .duration(800)
                                                               .attr("cy",newY)
                                                               .attr("cx",newX)
                                                               .attr("r", function() { return window.d3.tickStabilatesObject.getRadius(tData.number_in_tank); });
                                                }
                                                else {
                                                   thisCircle.transition()
                                                               .duration(800)
                                                               .style("opacity",0);
                                                }
                                             });
      //create the side menu
      var parasitesFound = new Array();
      var zoomedCirclesSize = window.d3.tickStabilatesObject.zoomedCircles.length;
      for( var x = 0; x < zoomedCirclesSize; x++) {
         var tempData = window.d3.tickStabilatesObject.zoomedCircles[x].data()[0];
         var parasitesSize = window.d3.tickStabilatesObject.parasites.length;
         for( var y = 0; y < parasitesSize; y++) {
            if(window.d3.tickStabilatesObject.parasites[y].id == tempData.parasite_id) {
               var parasiteName = window.d3.tickStabilatesObject.parasites[y].parasite_name;
               var flag = false;
               var parasitesFoundSize = parasitesFound.length;
               for( var z = 0; z < parasitesFoundSize; z++) {
                  if(parasiteName == parasitesFound[z]) {
                     flag = true;
                     break;
                  }
               }
               if(flag == false) {
                  parasitesFound[parasitesFoundSize] = parasiteName;
               }
               break;
            }
         }
      }
      
      window.d3.tickStabilatesObject.canvas.append("rect")
                                             .attr("class","sideMenu")
                                             .attr("width",0.5)
                                             .attr("height",window.d3.tickStabilatesObject.windowHeight)
                                             .attr("fill",function()
                                             {
                                                if(window.d3.tickStabilatesObject.body.style("background-color") == "rgb(4, 17, 23)")//dark theme
                                                {
                                                   return "#ffffff";
                                                }
                                                else
                                                {
                                                   return "#000000";
                                                }
                                             })
                                             .attr("x",window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth);
      
      window.d3.tickStabilatesObject.sideMenuTitle.html(year+", "+window.d3.tickStabilatesObject.frozenMaterial[materialIndex].material_name)
                                                   .style("left",((window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth) + 30) + "px")
                                                   .style("width",(window.d3.tickStabilatesObject.sideMenuWidth - 60) + "px")
                                                   .style("height","25px")
                                                   .style("top","20px");
      
      window.d3.tickStabilatesObject.numberOfTickStabilates.html("Number of Tick Stabilates : "+noOfCirclesToBeAffected)
                                                            .style("left",((window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth) + 50) + "px")
                                                            .style("width",(window.d3.tickStabilatesObject.sideMenuWidth - 80) + "px")
                                                            .style("height","16px")
                                                            .style("top","60px");
                                                            
      window.d3.tickStabilatesObject.numberOfParasites.html("Parasites found (" + parasitesFound.length + ")")
                                                      .style("left",((window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth) + 50) + "px")
                                                      .style("width",(window.d3.tickStabilatesObject.sideMenuWidth - 80)+"px")
                                                      .style("height","16px")
                                                      .style("top","85px");
      
      var parasitesPresentText = "";
      var parasitesFoundSize = parasitesFound.length;
      for(var i = 0; i < parasitesFoundSize; i++) {
         parasitesPresentText=parasitesPresentText+'<p style="color:' + window.d3.tickStabilatesObject.getColorUsingName(parasitesFound[i]) + ';"> - '+parasitesFound[i]+'</p>';
      }
      
      window.d3.tickStabilatesObject.parasitesPresent.html(parasitesPresentText)
                                                      .style("left",((window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth) + 65) + "px")
                                                      .style("width",(window.d3.tickStabilatesObject.sideMenuWidth - 80) + "px")
                                                      .style("height","400px")
                                                      .style("color","grey")
                                                      .style("top","110px");
      
      window.d3.tickStabilatesObject.body.selectAll(".sideMenuTitle").transition()
                                                                        .duration(800)
                                                                        .style("opacity",.8);
      
      window.d3.tickStabilatesObject.body.selectAll(".sideMenuText").transition()
                                                                        .duration(800)
                                                                        .style("opacity",.8);
      
      window.d3.tickStabilatesObject.toolTip.transition()
                                                .duration(800)
                                                .style("opacity",0)
                                                .style("left",((window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth)) + "px");
      
      window.d3.tickStabilatesObject.body.selectAll(".axisLabels").transition()
                                                                     .duration(800)
                                                                     .style("opacity",0);
      window.d3.tickStabilatesObject.body.selectAll(".search").transition()
                                                                  .duration(800)
                                                                  .style("opacity",0);
      window.d3.tickStabilatesObject.body.selectAll(".zoomModeText").transition()
                                                                        .duration(800)
                                                                        .style("opacity",0.8);
      window.d3.tickStabilatesObject.body.selectAll(".download").transition()
                                                                  .duration(800)
                                                                  .style("top",((window.d3.tickStabilatesObject.windowHeight - 40)) + "px")
                                                                  .style("font","14px sans-serif");
      window.d3.tickStabilatesObject.body.selectAll(".download").transition()
                                                                  .duration(800)
                                                                  .delay(800)
                                                                  .style("font","16px sans-serif")
                                                                  .style("left",((window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth) + 180)+"px");
      window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                                                               .duration(300)
                                                               .style("left","20px");
      window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                                                               .duration(800)
                                                               .delay(300)
                                                               .style("top",((window.d3.tickStabilatesObject.windowHeight - 40)) + "px")
                                                               .style("font","14px sans-serif");
      window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                                                               .duration(800)
                                                               .delay(1100)
                                                               //.style("top",((getWindowHeight()-40))+"px")
                                                               .style("font","16px sans-serif")
                                                               .style("left",((window.d3.tickStabilatesObject.windowWidth - window.d3.tickStabilatesObject.sideMenuWidth) + 40) + "px");
      window.d3.tickStabilatesObject.body.selectAll(".suggestion").remove();
   }
};

/**
 * This method calculates the radius of a zoomed in circle
 * 
 * This method's sole purpose is to scale down on the effects of the number of stabilates in storage on the radius of the
 * circle representing the stabilate so that some of the circles are not extremely large  and others extremely tiny.
 * Scalling down is done using the linear model 'y = mx + c' where:
 *    y = the radius of the circle
 *    m = 20/49
 *    x = number of stabilates in storage
 *    c = 225/49
 * 
 * @param {Integer} x : this is the number of stabilates in storage
 * 
 * @return Integer
 */
TickStabilates.prototype.getRadius = function (x) {
   var y = x * (20 / 49);
   return y + (225 / 49);
};

/**
 * This method returns the color corresponding to a parasite
 * 
 * @param {String} parasiteName
 * 
 * @return Color
 */
TickStabilates.prototype.getColorUsingName = function (parasiteName) {
   var parasitesSize = window.d3.tickStabilatesObject.parasites.length;
   for(var x = 0; x < parasitesSize; x++) {
      if(parasiteName == window.d3.tickStabilatesObject.parasites[x].parasite_name) {
         return window.d3.tickStabilatesObject.parasiteColors[x];
      }
   }
};

/**
 * This method contains logic on zooming out from a zoomed in sector
 * 
 * Refer to the zoomInOnSector method
 */
TickStabilates.prototype.zoomOut = function () {
   window.d3.tickStabilatesObject.searchBox[0][0].value = "Search";
   window.d3.tickStabilatesObject.canvas.selectAll(".sideMenu").remove();
   window.d3.tickStabilatesObject.body.selectAll(".sideMenuTitle").transition()
                                                                     .duration(800)
                                                                     .style("opacity",0);
   window.d3.tickStabilatesObject.body.selectAll(".search").transition()
                                                               .duration(800)
                                                               .style("opacity",1);
   window.d3.tickStabilatesObject.body.selectAll(".sideMenuText").transition()
                                                                     .duration(800)
                                                                     .style("opacity",0);
   window.d3.tickStabilatesObject.body.selectAll(".axisLabels").transition()
                                                                  .duration(800)
                                                                  .style("opacity",.8);
   window.d3.tickStabilatesObject.body.selectAll(".zoomModeText").transition()
                                                                     .duration(800)
                                                                     .style("opacity",0);
   window.d3.tickStabilatesObject.body.selectAll(".download").transition()
                                                               .duration(800)
                                                               .delay(300)
                                                               .style("left","20px")
                                                               .style("font","14px sans-serif");
                              //.style("top","20px");
   window.d3.tickStabilatesObject.body.selectAll(".download").transition()
                                                               .duration(800)
                                                               .delay(1100)
                                                               //.style("left","20px")
                                                               .style("font","12px sans-serif")
                                                               .style("top","20px");
   window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                                                            .duration(800)
                                                            .style("left","20px")
                                                            .style("font","14px sans-serif");
   window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                                                            .duration(800)
                                                            .delay(800)
                                                            //.style("left","20px")
                                                            .style("font","12px sans-serif")
                                                            .style("top","20px");
   window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                                                            .duration(300)
                                                            .delay(1600)
                                                            .style("left","100px");
   
   var zoomedCirclesSize = window.d3.tickStabilatesObject.zoomedCircles.length;
   for(var i = 0; i < zoomedCirclesSize; i++) {
      window.d3.tickStabilatesObject.zoomedCircles[i].transition()
                                                         .duration(800)
                                                         .attr("cy",window.d3.tickStabilatesObject.originalYs[i])
                                                         .attr("cx",window.d3.tickStabilatesObject.originalXs[i])
                                                         .attr("r",1.5);
   }
   //reset visibility of all rects
   window.d3.tickStabilatesObject.canvas.selectAll("rect")
                                          .transition()
                                          .duration(800)
                                          .style("opacity",1);
      //reset visibility of all circles
   window.d3.tickStabilatesObject.canvas.selectAll("circle")
                                          .transition()
                                          .delay(800)
                                          .duration(800)
                                          .style("opacity",1);
};

/**
 * This method returns the color corresponding to a parasite
 * 
 * @param {Object} parasiteID
 * 
 * @return Color
 */
TickStabilates.prototype.getColor = function(parasiteID) {
   var parasitesSize = window.d3.tickStabilatesObject.parasites.length;
   for(var x = 0; x < parasitesSize; x++) {
      if(parasiteID == window.d3.tickStabilatesObject.parasites[x].id) {
         return window.d3.tickStabilatesObject.parasiteColors[x];
      }
   }
};

/**
 * This method returns the X coordinate corresponding to the specified date
 * 
 * @param {String} dateText
 * 
 * @return Integer
 */
TickStabilates.prototype.getXFromDate = function(dateText) {
   var date = new Date(dateText);
   var yearDiff = (window.d3.tickStabilatesObject.endDate.getYear() + 1) - window.d3.tickStabilatesObject.startDate.getYear();
   var widthEquiv= yearDiff * 31557600000;
   var startYear=new Date((window.d3.tickStabilatesObject.startDate.getYear()+1900),1,1);
   var fromStartDate=date.getTime()-startYear.getTime();
   
   var x=(window.d3.tickStabilatesObject.windowWidth * fromStartDate) / widthEquiv;
   
   if(x < 4 || isNaN(x)) {
      x = 4;
   }
   return x;
};

/**
 * This method returns the Y coordinate corresponding to a material
 * 
 * @param {Integer} materialID
 * 
 * @return Integer
 */
TickStabilates.prototype.getY = function(materialID) {
   var materialsSize = window.d3.tickStabilatesObject.frozenMaterial.length;
   var sectionHeight = window.d3.tickStabilatesObject.windowHeight / materialsSize;
   var count = 0; 
   while(count < materialsSize) {
      if(materialID == window.d3.tickStabilatesObject.frozenMaterial[count].id) {
         var upperLimit=((count+1)*sectionHeight);
         var lowerLimit=(count*sectionHeight);
         var y = Math.floor(Math.random()*(upperLimit - lowerLimit + 1))+lowerLimit;
         if(y < 4) {
            y = 4;
         }
         return y;
      }
      count++;
   }
};

/**
 * This method returns the Y coordinate of a Y Axis separator
 * 
 * a Y Axis separator shows what area is represented by a frozen material
 * 
 * @param {Integer} materialID
 * 
 * @return Integer
 */
TickStabilates.prototype.getSeparatorY = function (materialID) {
   var materialsSize = window.d3.tickStabilatesObject.frozenMaterial.length;
   var sectionHeight = window.d3.tickStabilatesObject.windowHeight / materialsSize;
   for(var x = 0; x < materialsSize; x++) {
      if(materialID == window.d3.tickStabilatesObject.frozenMaterial[x].id) {
            return sectionHeight * x;
         }
   }
};

/**
 * This method switches the UI to either the dark or light theme depending on what the theme is currently
 */
TickStabilates.prototype.changeTheme = function () {
   if(window.d3.tickStabilatesObject.body.style("background-color")=="rgb(4, 17, 23)") {
      window.d3.tickStabilatesObject.body.transition()
                  .duration(500)
                  .style("background-color", "#a4a4a4");
      window.d3.tickStabilatesObject.body.selectAll("rect").transition()
                  .duration(500)
                  .attr("fill","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".axisLabels").transition()
                  .duration(500)
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".tooltip").transition()
                  .duration(500)
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".circleTooltip").transition()
                  .duration(500)
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".search").transition()
                  .duration(500)
                  .style("border","1px solid #000000")
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".searchSuggestion").transition()
                  .duration(500)
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".sideMenuTitle").transition()
                  .duration(500)
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".sideMenuText").transition()
                  .duration(500)
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".zoomModeText").transition()
                  .duration(500)
                  .style("color","#000000");
      window.d3.tickStabilatesObject.body.selectAll(".download").transition()
                  .duration(500)
                  .style("color","#6f3d0b");
      window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                  .duration(500)
                  .style("color","#6f3d0b");
   }
   else if(window.d3.tickStabilatesObject.body.style("background-color")=="rgb(164, 164, 164)") {
      window.d3.tickStabilatesObject.body.transition()
                  .duration(500)
                  .style("background-color", "#041117");
      window.d3.tickStabilatesObject.body.selectAll("rect").transition()
                  .duration(500)
                  .attr("fill","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".axisLabels").transition()
                  .duration(500)
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".tooltip").transition()
                  .duration(500)
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".circleTooltip").transition()
                  .duration(500)
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".search").transition()
                  .duration(500)
                  .style("border","1px solid #dadada")
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".searchSuggestion").transition()
                  .duration(500)
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".sideMenuTitle").transition()
                  .duration(500)
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".sideMenuText").transition()
                  .duration(500)
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".zoomModeText").transition()
                  .duration(500)
                  .style("color","#ffffff");
      window.d3.tickStabilatesObject.body.selectAll(".download").transition()
                  .duration(500)
                  .style("color","#b1cfe7");
      window.d3.tickStabilatesObject.body.selectAll(".theme").transition()
                  .duration(500)
                  .style("color","#b1cfe7");
   }

};

/**
 * This method creates the Download Dialog
 */
TickStabilates.prototype.createDownloadDialog = function () {
   var dialogWidth = 300;
   var dialogHeight = 300;
   var dialogX = this.windowWidth/2 - dialogWidth/2;
   var dialogY = this.windowHeight/2 - dialogHeight/2;
   var downloadDialog = this.body.append("div")
                                    .attr("class", "downloadDialog")
                                    .style("left", dialogX + "px")
                                    .style("top", dialogY + "px")
                                    .style("width", dialogWidth + "px")
                                    .style("height", dialogHeight + "px")
                                    .style("opacity",0)
                                    .style("padding-bottom", "10px");
   downloadDialog.on("mousemove", function() { 
                        if(d3.select(this).style("opacity") == 1) {
                           window.d3.tickStabilatesObject.ignoreFocus = true;
                        }
                     })
                  .on("mouseout", function() { 
                        if(d3.select(this).style("opacity") == 1) {
                           window.d3.tickStabilatesObject.ignoreFocus = false;
                        }
                     })
                  .on("click", function() {
                        if(d3.select(this).style("opacity") == 1) {
                              window.d3.tickStabilatesObject.ignoreClick = true;
                           }
                     });
   downloadDialog.append("p").text("Please select the type of data you want to download")
                      .style("margin-left","20px")
                      .style("font", "14px sans-serif");
   var downloadDialogTable = downloadDialog.append("table");
   for(key in this.stabilates[0]) {
      //this.stabilates[0][key];
      if(key != "id" && key != "parasite_id" && key != "frozen_material_id") {
         var tr = downloadDialogTable .append("tr");
         var td1 = tr.append("td");
         var checkBox = td1.append("input")
                        .attr("type", "checkbox")
                        .attr("value", key)
                        .attr("checked", "true")
                        .style("margin-right","10px")
                        .style("margin-left","20px");
         window.d3.tickStabilatesObject.stabilateColumns.push(key);
         var td2 = tr.append("td");
         td2.append("p").text(key);
         checkBox.on("click", function() {
            if(this.checked == true) {
               window.d3.tickStabilatesObject.stabilateColumns.push(this.value);
            }
            else {
               window.d3.tickStabilatesObject.stabilateColumns.splice(window.d3.tickStabilatesObject.getStabilateColumnIndex(this.value), 1);
            }
         });
      }
   }
   
   downloadDialog.append("button").html("Okay")
                     .style("position", "absolute")
                     .style("left", (dialogWidth - 80) + "px")
                     .on("click", function() {
                        var thisA = window.d3.tickStabilatesObject.downloadDialog.append("a")
                                                                     .attr("download","Tick_Stabilates.csv");
                        thisA.attr("href",function() {
                                    return "data:text/csv;charset=utf-8,"+window.d3.tickStabilatesObject.getDownloadText();
                                 });
                        thisA[0][0].click();
                        thisA.remove();
                        window.d3.tickStabilatesObject.downloadDialog.style("opacity", 0);
                     });
   downloadDialog.append("div")
                     .style("height" ,"30px");
   return downloadDialog;
};

/**
 * This method returns the index of a stabilates column
 * 
 * @param {String} name : the name of the column
 * 
 * @return Integer
 */
TickStabilates.prototype.getStabilateColumnIndex = function (name) {
   var stabilateColumnsSize = window.d3.tickStabilatesObject.stabilateColumns.length;
   for(var i = 0; i < stabilateColumnsSize; i ++) {
      if(window.d3.tickStabilatesObject.stabilateColumns[i] == name) {
         return i;
      }
   }
};
