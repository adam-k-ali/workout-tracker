package com.adamkali.workouts.controllers;

import com.adamkali.workouts.database.entities.ExerciseType;
import com.adamkali.workouts.database.repository.ExercisesRepository;
import com.adamkali.workouts.services.ExerciseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/exercises")
public class ExerciseController {

    @Autowired
    private ExerciseService service;

    @GetMapping(name = "/all", produces = "application/json")
    public List<ExerciseType> getExercises() {
        return service.listAll();
    }

}
