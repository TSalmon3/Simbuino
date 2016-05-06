﻿var simulation;

$(function () {

	String.prototype.replaceAll = function (search, replacement) {
		var target = this;
		return target.replace(new RegExp(search, 'g'), replacement);
	};

	Simulation = Class.create({

		ctor: function () {

			var self = this;			
			this.Canvas = document.getElementById("canvas");
			this.Context = this.Canvas.getContext("2d");
			this.Context.mozImageSmoothingEnabled = false;
			this.Context.webkitImageSmoothingEnabled = false;
			this.Context.imageSmoothingEnabled = false;

			// initialize the emulator
			AtmelContext.Init();
			AtmelProcessor.Init();
			ADC.Init();
			Buttons.Init();
			SPI.Init();
			USART.Init();
			EEPROM.Init();
			Lcd.Init(this.Context);

			this.FrameRate = 60;
			this.CyclesPerFrame = Math.floor(AtmelProcessor.ClockSpeed / this.FrameRate);

			this.AudioPlayer = AudioPlayer.create();
			if (!this.AudioPlayer.Active) {
				$("#error").text("WebAudio not supported by this browser, sound is disabled.");
			}
			this.CreateUpdateTimer();

			// intercept key messages
			this.Canvas.addEventListener("keydown", function (e) { self.ProcessKey(e.keyCode, true) }, true);
			this.Canvas.addEventListener("keyup", function (e) { self.ProcessKey(e.keyCode, false) }, true);

			// handle file load button event
			$("#fileInput").change(function (e) { self.OnLoad(e); });

			// handle reset event
			$("#reset").click(function (e) { self.OnReset(e); });
		},

		CreateUpdateTimer: function ()
		{
			var self = this;
			this.NumFrames = 0;
			this.StartTime = new Date().getTime();
			setInterval(function () { self.Update(); }, 1000 / this.FrameRate)
		},

		Update: function ()
		{			
			var lastCycle = AtmelContext.Clock + this.CyclesPerFrame;
			if (this.Loaded)
				AtmelProcessor.RunTo(lastCycle);
			this.NumFrames++;
			var currentTime = new Date().getTime();
			var elapsed = (currentTime - this.StartTime) / 1000;
			if (elapsed >= 1) {
				$("#fps").text(Math.floor(this.NumFrames / elapsed) + " fps");
				this.StartTime = currentTime;
				this.NumFrames = 0;
			}
		},

		ProcessKey: function (keyCode, value)
		{
			if (keyCode == 69) // E
				Buttons.Up().set(value);
			if (keyCode == 83) // S
				Buttons.Left().set(value);			
			if (keyCode == 68) // D
				Buttons.Down().set(value);
			if (keyCode == 70) // F
				Buttons.Right().set(value);
			if (keyCode == 75) // K
				Buttons.A().set(value);
			if (keyCode == 76) // L
				Buttons.B().set(value);
			if (keyCode == 82) // R
				Buttons.C().set(value);
		},

		OnLoad: function (e) {
			var self = this;
			var file = $("#fileInput")[0].files[0];
			{
				var reader = new FileReader();
				reader.onload = function (e) {
					try
					{
						self.CurrentFirmware = reader.result.replaceAll("\r", "").split("\n")

						// reset the emulator and load the game
						AtmelContext.Reset();
						self.Loaded = HexDecoder.Decode(self.CurrentFirmware);
						AtmelProcessor.InitInstrTable();
						Lcd.Reset();
						Buttons.Reset();
					}
					catch (e)
					{
						alert("Couldn't load .HEX file.");
					}
				}
				reader.readAsText(file);
			}
		},

		OnReset: function (e) {
			var self = this;
			if (!self.CurrentFirmware)
				return;
			try
			{
				AtmelContext.Reset();
				self.Loaded = HexDecoder.Decode(self.CurrentFirmware);
				AtmelProcessor.InitInstrTable();
				Lcd.Reset();
				Buttons.Reset();
			}
			catch (e) {
			}
		}

	});

	simulation = Simulation.create();

});