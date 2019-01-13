<template>
  <v-layout row wrap class="noto-sans">
    <v-flex xs12 class="mb-4">
      <p class="headline font700">[ 한국어 읽기(올바르게 발음하기) 평가 ]</p>
      <p class="subheading font700">1. 아래의 한국어 문장을 (필요하면 몇 번 들어본 후) 올바르게 발음하면서 큰소리로 읽으시오.</p>
      <v-card color="grey lighten-2">
        <v-card-title primary-title>
          <div>
            <span>{{question}}</span>
          </div>
        </v-card-title>
      </v-card>
    </v-flex>
    <v-flex xs5>
      <v-btn block round color="primary" dark @click="questionSpeech">
        <v-icon left>mic</v-icon>원본 듣기연습 버튼
      </v-btn>
    </v-flex>
    <v-flex xs7></v-flex>
    <v-flex xs5><br />
      <v-btn v-show="!btnStop" @click.native="startRecording" block round color="primary" dark>
        <v-icon left>mic</v-icon>읽기평가 버튼 (위의 문장을 녹음하세요)
      </v-btn>      
      <v-btn v-show="btnStop" @click.native="stopRecording" block round color="error" dark>
        <v-icon left>stop</v-icon> Stop
      </v-btn>
    </v-flex>
    <v-flex xs1></v-flex>
    <v-flex xs6>
      <strong>[녹음파일 듣기 버튼]</strong>
      <audio controls id="reload"></audio>
    </v-flex>
    <v-flex v-show="loader" xs12>
      <div class="text-xs-center">
        <v-progress-circular indeterminate v-bind:size="100" v-bind:width="3" class="orange--text"></v-progress-circular>
      </div>
    </v-flex>
    <v-flex v-show="result || resultError" xs12 class="mb-5">
      <v-card v-show="result" color="darken-2">
        <div class="result-text text-xs-center" v-html="textHTML"></div>
      </v-card>
      <v-card v-show="resultError" color="red darken-3 white--text">
        <v-card-title primary-title>
          <div class="headline">An Unexpected Error Occurred</div>
        </v-card-title>
        <v-card-actions>
          <v-btn @click.native="redirectError" flat dark>Try Again</v-btn>
        </v-card-actions>
      </v-card>
    </v-flex>

    <v-flex xs12 class="mt-5">
      <p class="headline font700">[ 한국어 받아쓰기 평가 ]</p>
      <p class="subheading font700">1. 다음 녹음을 들으면서 그 내용을 입력(타이핑)하시오.</p>
      <v-btn block round color="primary" dark @click="questionSpeech">
        <v-icon left>mic</v-icon>듣기평가 버튼 (들으면서 아래 박스에 타이핑 하세요)
      </v-btn>
      <v-layout row>      
        <v-flex xs12 sm12>
          <v-text-field
            name="input-1"
            label="받아쓰기 평가"
            placeholder="여기에 내용을 입력해주세요."
            textarea
            rows="6"
          ></v-text-field>
        </v-flex>
      </v-layout>
      <br>
    </v-flex>
  </v-layout>
</template>

<script>
  var audio_context;
  var recorder;
  import axios from 'axios';
  
  export default {
    props: {
      headtitle: '',
    },
    data() {
      return {
        btn: true,
        btnStop: false,
        loader: false,
        result: false,
        resultError: false,
        audioSrc: "",
        textResult: "",
        textHTML: '',
        apiKey: 'AIzaSyCNJF83fwI3sViIYLP7Swwzrt16e6MLVrk', //api key
        selected: 'ko-KR',        
        data: {
          "audio": {
            "content": null
          },
          "config": {
            "encoding": "LINEAR16",
            "sampleRateHertz": 48000,
            "languageCode": null
          }
        },
        question: '',
        synth: window.speechSynthesis,
        voiceList: [],
        speech: new window.SpeechSynthesisUtterance(),
        recognition: null,
        listening: false,
      }
    },
    methods: {
      questionSpeech() {
        this.speech.text = this.question;
        this.voiceList = this.synth.getVoices();

        this.speech.voice = this.voiceList[13];

        this.synth.speak(this.speech);
      },
      startUserMedia(stream) {
        const input = audio_context.createMediaStreamSource(stream);
        // Media stream created
        recorder = new Recorder(input);
        // Recorder initialised
      },
      startRecording() {
        this.recognition.start();

        // Clear Recording        
        // recorder.clear();
        // const au = document.getElementById('reload');
        // au.src = '';
        // // Start Recording
        // this.result = false;
        // this.resultError = false;
        // recorder && recorder.record();
        this.result = false;
        this.btn = false;
        this.btnStop = true;
        setTimeout(this.stopRecording, 50000)
      },
      stopRecording() {
        this.recognition.stop();
        console.log(this.recognition);
        // // Stopped Recording
        // recorder && recorder.stop();
        this.btnStop = false;
        // this.loader = true;
        // // create WAV download link using audio data blob
        // this.processRecording();
        // this.createDownloadLink();
      },
      createDownloadLink() {
        const au = document.getElementById('reload');
        au.src = '';
        recorder && recorder.exportWAV(function(blob) {
          const url = URL.createObjectURL(blob);
          const au = document.getElementById('reload');
        
          au.controls = true;
          au.src = url;
        });
      },
      processRecording() {
        const vm = this;

        recorder && recorder.exportWAV(function(blob) {
          var reader = new window.FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const baseData = reader.result;
            const base64Data = baseData.replace("data:audio/wav;base64,", "");
            vm.data.audio.content = base64Data;
            vm.data.config.languageCode = vm.selected;
            axios.post(
              `https://speech.googleapis.com/v1/speech:recognize?key=${vm.apiKey}`,
              vm.data).then(response => {
              const result = response.data.results[0].alternatives[0];
              vm.textResult = result.transcript;
              vm.btn = true;
              vm.loader = false;
              vm.result = true;

              // 결과 표시
              let textHTML = '';
              for (let i = 0; i < vm.question.length; i += 1) {
                const a = vm.question.substring(i, i+1);
                const b = vm.textResult.substring(i, i+1);
                if (a === b) textHTML += a;
                else textHTML += `<span class='red'>${b}</span>`;
              }

              textHTML += `<span class='red'>${vm.textResult.substring(vm.question.length+1, vm.textResult.length)}</span>`;

              this.textHTML = textHTML;
            }).catch(error => {
              vm.loader = false;
              vm.resultError = true;
              console.log("ERROR:" + error);
            })
          }
        });
      },
      redirectError() {
        window.location.href = "http://localhost:8080/"
      }
    },
    created() {
      this.$emit('update:headtitle', '형성평가');
      try {

        const Recognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!Recognition) {
          alert(
            'Speech Recognition API is not supported in this browser, try chrome'
          );
          return;
        }

        this.recognition = new Recognition();
        this.recognition.lang = 'ko-KR';
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = event => {
          const text = event.results[0][0].transcript;
          console.log(event);
          console.log('transcript', text);
          this.textResult = text;
          this.btn = true;
          this.loader = false;
          this.result = true;

          // 결과 표시
          let textHTML = '';
          for (let i = 0; i < this.question.length; i += 1) {
            const a = this.question.substring(i, i+1);
            const b = this.textResult.substring(i, i+1);
            if (a === b) textHTML += a;
            else textHTML += `<span class='red'>${b}</span>`;
          }

          textHTML += `<span class='red'>${this.textResult.substring(this.question.length+1, this.textResult.length)}</span>`;

          this.textHTML = textHTML;
        };
        this.recognition.onspeechend = () => {
          console.log('stopped');

          //this.setState({ show: true });
        };

        this.recognition.onnomatch = event => {
          console.log('no match');
          this.textResult = "인식할 수 없습니다.";
        };

        this.recognition.onstart = () => {
          this.listening = true;
        };

        this.recognition.onend = () => {
          console.log('end');
          this.listening = false;
          this.stopRecording();
        };

        this.recognition.onerror = event => {
          console.log('error', event);
        };

        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
        window.URL = window.URL || window.webkitURL;
  
        audio_context = new AudioContext;
        console.log('Audio context set up.');
        console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
      } catch (e) {
        alert('No web audio support in this browser!');
      }
      const that = this;
      navigator.getUserMedia({
        audio: true
      }, function(stream) {
        that.startUserMedia(stream)
      }, function(e) {
        console.log('No live audio input: ' + e);
      });

      this.question = this.$route.query.ctx;
    }
  }
</script>


<style>
  .font700 {
    font-weight: 700;
  }

  .noto-sans {
    font-family: 'Noto Sans KR', sans-serif;
  }

  .slide-enter {
    opacity: 0;
  }
  
  .slide-enter-active {
    animation: slide-in 1s ease-out forwards;
    transition: opacity .5s;
  }
  
  .slide-move {
    transition: transform 1s;
  }
  
  @keyframes slide-in {
    from {
      transform: translateY(20px);
    }
    to {
      transform: translateY(0);
    }
  }

  audio {
    width: 100%;
  }

  .result-text {
    font-weight: 700;
    font-size: 18px;
    padding: 10px;
  }
</style>
