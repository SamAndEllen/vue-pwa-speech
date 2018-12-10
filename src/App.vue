<template>
       <v-app id="app" standalone>
        <v-toolbar>
             <v-container>
            <v-toolbar-title class="blue--text">{{ headtitle }}</v-toolbar-title>
            </v-container>
        </v-toolbar>
        <main class="mt-4">
            <v-container>
               <router-view :headtitle.sync="headtitle"></router-view>
            </v-container>
        </main>
    </v-app>
</template>

<script>
export default {
    data() {
        return {
            headtitle: '',
        }
    },
}
</script>


