var app = angular.module('bet-the-bill', []);
function DinerCtrl($scope) {

   // Initialize everything
   $scope.showResult = false;
	 $scope.showForm = true;
	 $scope.showPie = true;
	 $scope.showAbout = false;
   $scope.diners = [
		{ 'name': 'Diner 1',
      'amount': 1,
	  	'id': 1},
		{	'name': 'Diner 2',
			'amount': 1,
			'id': 2},
		{	'name': 'Diner 3',
			'amount': 1,
			'id': 3}
		];
   $scope.nextDiner = 4;
   $scope.total = 0;
   $scope.disableRemoveDiner = false;
   wheelposition = 0; //Initial wheel position for animation

	 //called when the user clicks Add Diner button
   $scope.addDiner = function() {
      $scope.diners.push({
         'name': 'Diner ' + $scope.nextDiner,
         'amount': 1,
		 'id': $scope.nextDiner
      });
      $scope.nextDiner++;
			$scope.updateChart();
	  if(1 < $scope.diners.length) $scope.disableRemoveDiner = false;
   }

   //computes the total bill
   $scope.total = function() {
      var t = 0;
      angular.forEach($scope.diners, function(d) {
         t += d.amount;
      });
      return parseFloat(t);
   }

	 //called when the user clicks the red X button next to a diner row
	 $scope.removeDiner = function(idx) {
		//If there are two diners left, disable the remove diner button so we can't go down to zero diners. Also, disabling the button should come before the removal to avoid race conditions, I think
		//Also, I'm fine with have users playing BetTheBill solitaire. There's no reason to do it, but no real reason to forbid it either. "That government is best which governs least."
		if(2 == $scope.diners.length) $scope.disableRemoveDiner = true;
		//Remove the diner and update the chart
     	$scope.diners.splice(idx, 1);
			$scope.updateChart()
   }

	//This function swaps the main page and the about page. It may look odd that I'm manually editing ng-hide, but I couldn't get angular to work with a delay
	$scope.swapAbout = function() {
		if(false == $scope.showAbout) {
			$scope.showAbout = true;
			document.getElementById("content-container").classList.toggle("flip");
			document.getElementById("about-text").classList.remove("ng-hide");
			document.getElementById("about-link").innerHTML = "(Back to Bet the Bill)";
		}
		else{
			$scope.showAbout = false;
      setTimeout( function() {scroll(0,0);},290);
      setTimeout( function() {if($scope.showAbout==false){document.getElementById("about-text").classList.add("ng-hide");};},600);
      document.getElementById("content-container").classList.toggle("flip");
      document.getElementById("about-link").innerHTML = "(What is Bet the Bill?)";
			$scope.updateChart();
		}
	}

	$scope.goBack = function() {
		$scope.showForm = true;
		$scope.showResult = false;
	}

   $scope.betBill = function() {

      // hide the form
      $scope.showForm = false;

      // compute result
      var total = $scope.total(); // get total

      // only bother computing a loser if the total exists. Also avoids divide-by-zero error in the pie chart drawing function.
      if(0 == total) {total = $scope.diners.length;	}

	      var die = Math.random() * total; // roll a die. By the way, Math.random includes 0 but excludes 1.
	      var cumTotal = 0;
	      for (var i = 0; i < $scope.diners.length; i++) {

	         // add this guy to cumulative total
	         cumTotal += parseFloat($scope.diners[i].amount);
					if(0 == $scope.total()) cumTotal = (i+1); //more edge case shenanigans for 0 total

	         // check if this guy has to pay
	         // Note that the 'less than' comparison is essential for maximum fairness, given that Math.random includes 0 but not 1.
	         if (die < cumTotal) {
	            $scope.setLoser(i);
	            break;
	         }
	      }

	      //This section animates the spinning wheel.

	      //First, it finds the svg element and calls it wheel. This is the thing that will spin.
		  var wheel = document.querySelector('svg');

		  //Second, it clears the wheel's the current style information
	      wheel.removeAttribute('style');

	      //Third, it computes a new position for the wheel
	      wheelposition = wheelposition - wheelposition%360 + 1800 - 360*die/total; //The -wheelposition%360 is for when people use the Go Back button and spin again. This effectively resets the wheelposition to 0 so that a rotation by 360*die/total lands on the correct section.
	      var css = '-webkit-transform: rotate(' + wheelposition + 'deg);'
	            + 'transform: rotate(' + wheelposition + 'deg);';

	      //Fourth, it sets the newly computed style so that the wheel spins to the new position
	      wheel.setAttribute(
	        'style', css
	      );


   }

   $scope.setLoser = function(idx) {
      $scope.loser = $scope.diners[idx];
      $scope.showResult = true;
   }

		// get array of diner amounts
		var amounts = function() {
				var temp = new Array;

				for(var idx in $scope.diners) {
						temp.push($scope.diners[idx].amount);
				}
				return temp
		}


	 // Initialize d3 plot

	 // d3 colors
	 //var getcolor = d3.scale.category10()
	 var getcolor = ["#1f77b4", "#2ca02c", "#ff7f0e", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]

	var width = document.getElementById('pie-chart').offsetWidth,
			r = width/2,
			dur = 1000,           // duration, in milliseconds
			donut = d3.layout.pie().sort(null),
			arc = d3.svg.arc().innerRadius(0).outerRadius(r*11/12);

		// ---------------------------------------------------------------------
		var svg = d3.select("#pie-chart").append("svg:svg")
				//.attr("width", width)
				//.attr("height", width)
				//.attr('viewBox','0 0 '+width+' '+width)			// <--- This should work, but still doesn't
    		//.attr('preserveAspectRatio','xMinYMin');		// By the way, here is StackOverflow on how to make d3 responsive: http://stackoverflow.com/questions/17626555/responsive-d3-chart
		var arc_grp = svg.append("svg:g").attr("class", "arcGrp")
		var label_group = svg.append("svg:g").attr("class", "lblGroup")


		// Store the currently-displayed angles in this._current.
		// Then, interpolate from this._current to the new angles.
		function arcTween(a) {
				var i = d3.interpolate(this._current, a);
				this._current = i(0);
				return function(t) {
						return arc(i(t));
				};
		}



		// update chart
		$scope.updateChart = function() {
			///////////////////////////////////////////////////
			width = document.getElementById('pie-chart').offsetWidth;
			r = width/2;
			arc = d3.svg.arc().innerRadius(0).outerRadius(r*11/12);
			svg.attr("width", width).attr("height", width);
			arc_grp.attr("transform", "translate(" + (width / 2) + "," + (width / 2) + ")");
			label_group.attr("transform", "translate(" + (width / 2) + "," + (width / 2) + ")");
			///////////////////////////////////////////////////


				myAmounts = amounts();
				//If an amount is negative, don't redraw anything - it breaks the graph, literally
				//Speaking of broken, this section isn't working
				for(var i=0; i<myAmounts.length; i++) {
					if(!(0 <= myAmounts[i])) {
						myAmounts[i]=0;
					}
				}

				//If total is 0, draw slices as if they were equal (to 1)
				if(0 == $scope.total()) {
					for( var i = 0; i < myAmounts.length; i++ ) {
						myAmounts[i] = 1;
					}
				}

				var arcs = arc_grp.selectAll("path")
						.data(donut(myAmounts));
				arcs.enter().append("svg:path")
						.attr("stroke", "black")
						.attr("stroke-width", 0)
						.attr("fill", function(d, i) {return getcolor[($scope.diners[i].id-1) % getcolor.length];})
						.attr("d", arc)
						.each(function(d) {this._current = d});

				// remove old paths
				arcs.exit().remove()


				// DRAW SLICE LABELS
				// Warning: some numbers are hardcoded in below. FYI.
				var sliceLabel = label_group.selectAll("text")
						.data(donut(myAmounts));
				sliceLabel.enter().append("svg:text")
						.attr("class", "arcLabel")
						.attr("x", r-width/4)
						.attr("y", 0)
						.attr("transform", function(d) {
										var coordinates = arc.centroid(d);
										var rotationangle = Math.atan(coordinates[1]/coordinates[0])*180/3.14159265358;
										if(coordinates[0] < 0) { rotationangle = rotationangle-180; }
										return "rotate(" + rotationangle + ")"; })
						.attr("text-anchor", "middle")
						.attr("dominant-baseline", "central")
						.text(function(d, i) {return $scope.diners[i].name; })
						.attr("style", function(d) {
														if(d.data > 0 ) { return "font-size: " + width/12 + "px;"}
														else { return "font-size: 0;"};});


				sliceLabel.exit().remove()

				arcs.data(donut(myAmounts)); // recompute angles, rebind data
				arcs.attr("fill", function(d, i) {return getcolor[($scope.diners[i].id-1) % getcolor.length];});
				arcs.transition().ease("elastic").duration(dur).attrTween("d", arcTween);


				//why do we have all this happening twice? I guess this second one has the elastic animation, and the first one declares the variable. --Update: I tried removing the first pass through and the Diner labels animated into position. I think we need both halves - the first half to make the labels appear and the second half to make them move. Also, fun fact: changing the first half will let us easily animate the labels as they enter.
				sliceLabel.data(donut(myAmounts));
				sliceLabel.transition().ease("elastic").duration(dur)
				.attr("x", r-width/4)
				.attr("y", 0)
				.attr("transform", function(d) {
								var coordinates = arc.centroid(d)
								var rotationangle = Math.atan(coordinates[1]/coordinates[0])*180/3.1415926;
								if(coordinates[0] < 0) { rotationangle = rotationangle-180; }
								return "rotate(" + rotationangle + ")"; })
				.attr("text-anchor", "middle")
				.attr("dominant-baseline", "central")
				.text(function(d, i) {return $scope.diners[i].name; })
				.attr("style", function(d, i) {
												if(d.data > 0 ) { return "font-size: " + width/Math.max(10,1.4*$scope.diners[i].name.length) + "px;"}
												else { return "font-size: 0;"};});

				//pieLabel.text(data.label);
			}

		// initialize d3 plot
		$scope.updateChart()

	//redraw pie chart on resize
	window.onresize = function(event) {
		$scope.updateChart();
	}

}
