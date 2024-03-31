package com.adamkali.workouts.services;

import com.adamkali.workouts.database.entities.ExerciseType;
import com.adamkali.workouts.database.repository.ExercisesRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ExerciseService {

    @Autowired
    private ExercisesRepository exercisesRepository;

    public List<ExerciseType> listAll() {
        List<ExerciseType> exercises = new ArrayList<>();
        exercisesRepository.findAll().forEach(exercises::add);
        return exercises;
    }

    public void save(ExerciseType exercise) {
        exercisesRepository.save(exercise);
    }
}
