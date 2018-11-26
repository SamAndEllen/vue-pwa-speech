<template>
  <v-layout row wrap class="noto-sans">
    <v-flex xs12>
      <p class="headline font700">[ 한국어 읽기(올바르게 발음하기) 평가 ]</p>
      <p class="subheading font700">1. 아래의 한국어 문장을 (필요하면 몇 번 들어본 후) 올바르게 발음하면서 큰소리로 읽으시오.</p>
      <v-card color="grey lighten-2">
        <v-card-title primary-title>
          <div>
            <span>{{question}}</span>
          </div>
        </v-card-title>
      </v-card>
      <v-btn v-show="btn" @click.native="startRecording" block round color="primary" dark>
        <v-icon left>mic</v-icon>읽기평가 버튼 (위의 문장을 녹음하세요)
      </v-btn>
      <v-btn v-show="btnStop" @click.native="stopRecording" block round color="error" dark>
        <v-icon left>stop</v-icon> Stop
      </v-btn>
      </br>
    </v-flex>
    <v-flex xs12 class="mb-5">
      <div v-show="loader" class="text-xs-center">
        <v-progress-circular indeterminate v-bind:size="100" v-bind:width="3" class="orange--text"></v-progress-circular>
      </div>
      <v-card v-show="result" color="darken-2 orange--text">
        <h4 class="text-xs-center">{{textResult}}</h4>
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
      </br>
    </v-flex>
  </v-layout>
</template>

<script>
  var audio_context;
  var recorder;
  import axios from 'axios';
  
  export default {
    data() {
      return {
        btn: true,
        btnStop: false,
        loader: false,
        result: false,
        resultError: false,
        textResult: "",
        apiKey: 'AIzaSyCNJF83fwI3sViIYLP7Swwzrt16e6MLVrk', //api key
        selected: 'ko-KR',        
        data: {
          "audio": {
            "content": null
          },
          "config": {
            "encoding": "LINEAR16",
            "sampleRateHertz": 44100,
            "languageCode": null
          }
        },
        question: '',
        synth: window.speechSynthesis,
        voiceList: [],
        speech: new window.SpeechSynthesisUtterance(),
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
        // Start Recording
        recorder && recorder.record();
        this.result = false;
        this.btn = false;
        this.btnStop = true;
        setTimeout(this.stopRecording, 58000)
      },
      stopRecording() {
        // Stopped Recording
        recorder && recorder.stop();
        this.btnStop = false;
        this.loader = true;
        // create WAV download link using audio data blob
        this.processRecording();
        recorder.clear();
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
              vm.textResult = result.transcript
              vm.btn = true;
              vm.loader = false;
              vm.result = true;
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
      try {
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

      this.question = this.$route.query.question;
      // 문재인 대통령은 6일 우선 7월과 8월 두 달간의 가정용 전기요금에 대해 한시적 누진제 완화와 저소득층과 사회복지시설 등에 대한 전기요금 할인 확대 등 전기요금 부담 경감 방안을 조속히 확정해 7월분 전기요금 고지부터 시행해주기 바란다고 말했다.
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
</style>
