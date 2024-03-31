package com.adamkali.workouts.database.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class ExerciseType {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;
    private String name;

    protected ExerciseType() {
    }

    public ExerciseType(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "ExerciseType [id=%d, name=%s]".formatted(id, name);
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
